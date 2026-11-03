/* 项目 04 · CacheLab 缓存引擎
   LRU 淘汰 → TTL 过期 → 命中率 → 并发安全。缓存是面试高频题，也是最容易写出竞态的地方。 */
window.PROJECTS = window.PROJECTS || [];
window.PROJECTS.push({
  id: "cache-lab",
  index: "04",
  type: "project",
  title: "CacheLab 线程安全缓存",
  subtitle: "LRU、TTL、命中率与并发控制",
  summary:
    "从零实现一个可用的本地缓存：容量满时淘汰最久未使用的条目，支持过期时间，统计命中率，并保证多线程下不会把内部结构改坏。",
  level: "进阶项目",
  duration: "6–8 小时",
  mode: "core",
  modeLabel: "并发 / 集合",
  accent: "#b5432e",
  stack: ["LinkedHashMap", "LRU", "TTL", "synchronized", "LongSupplier"],
  resumeLine: "实现线程安全 LRU + TTL 缓存，包含命中率统计与可注入时间源",
  resume: {
    keywords: ["LRU", "缓存淘汰", "TTL", "线程安全", "可测试性"],
    bullets: [
      "基于 LinkedHashMap(accessOrder=true) 实现 O(1) LRU 淘汰，容量满时移除最久未访问条目。",
      "实现 TTL 过期，通过注入 LongSupplier 时间源让过期逻辑可测试、不依赖真实时间。",
      "统计 hits / misses / 命中率，为缓存效果提供可观测指标。",
      "用 synchronized 保护 LinkedHashMap 的结构修改，通过 8 线程并发读写验证无丢失更新。",
    ],
  },
  highlights: [
    "LRU 的核心不是排序，而是“访问即更新顺序”，LinkedHashMap 已经帮你做好。",
    "TTL 用真实时间会导致测试不稳定；注入时间源是工程上的标准做法。",
    "命中率是缓存是否值得存在的唯一证据，必须可观测。",
    "并发版不是加个 synchronized 就完事，要明确锁保护的是哪段不变量。",
  ],
  sections: [
    { type: "h", text: "LRU 要解决什么" },
    {
      type: "p",
      html: "缓存容量有限，满了必须淘汰一条。LRU（Least Recently Used）选择“最久没有被访问”的条目。关键动作有两个：访问时把条目移到队尾；插入超出容量时移除队头。<code>LinkedHashMap</code> 的 <code>accessOrder=true</code> 正好按访问顺序维护链表。",
    },
    {
      type: "code",
      file: "LruCore.java",
      code: String.raw`new LinkedHashMap<K, V>(16, 0.75f, true) {
    @Override
    protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
        return size() > capacity;
    }
};`,
    },
    {
      type: "callout",
      tone: "deep",
      title: "为什么 removeEldestEntry 只适合单线程",
      html: "它在 <code>put</code> 内部被调用，会自动移除队头，代码很短。但 <code>LinkedHashMap</code> 本身不是线程安全的：并发 <code>get</code>（会改访问顺序）和 <code>put</code> 可能破坏链表。并发场景必须外部加锁或换 <code>ConcurrentHashMap</code> + 自己维护链表。",
    },
    { type: "h", text: "TTL：时间必须可注入" },
    {
      type: "p",
      html: "直接在代码里调用 <code>System.currentTimeMillis()</code>，测试就只能 <code>Thread.sleep</code>，又慢又不稳定。把时间源抽象成 <code>LongSupplier</code>，生产传 <code>System::currentTimeMillis</code>，测试传一个可手动推进的计数器。",
    },
    {
      type: "code",
      file: "TtlTest.java",
      code: String.raw`AtomicLong now = new AtomicLong(1000);
TtlCache<String, String> cache = new TtlCache<>(500, now::get);
cache.put("k", "v");
now.addAndGet(400);   // 还没过期
assertNotNull(cache.get("k"));
now.addAndGet(200);   // 超过 500ms
assertNull(cache.get("k"));`,
    },
    { type: "h", text: "命中率：缓存价值的度量" },
    {
      type: "list",
      items: [
        "命中率 = hits / (hits + misses)。低于 30% 的缓存通常不值得维护。",
        "只统计 <code>get</code> 请求；<code>put</code> 不算命中。",
        "过期条目被访问应计为 miss，并从缓存中移除。",
        "命中率要能上报到监控，否则无法判断扩容或调 TTL。",
      ],
    },
    { type: "h", text: "并发：锁保护的是不变量" },
    {
      type: "p",
      html: "对 LRU 来说，不变量是“map 结构完整 + size 不超过容量 + 访问顺序一致”。<code>synchronized</code> 把所有读写包起来最简单，但吞吐有限。生产级实现通常用分段锁或 <code>ConcurrentHashMap</code> + 并发链表，代价是复杂度大幅上升。",
    },
    {
      type: "callout",
      tone: "warn",
      title: "synchronized 方法 ≠ 高性能",
      html: "锁的粒度要覆盖复合操作（判断 + 修改 + 淘汰），但不要锁住 IO、日志、回调。缓存命中路径应该极短；如果 <code>get</code> 里做了远程调用，锁会成为瓶颈。",
    },
  ],
  architecture: {
    tree: `cache-lab/
├── src/main/java/com/example/cache/
│   ├── LruCache.java          # 单线程 LRU + 命中率
│   ├── TtlCache.java          # TTL + 可注入时间源
│   ├── ConcurrentCache.java   # synchronized 版 LRU
│   └── Main.java              # 演示与压测入口
└── src/test/java/com/example/cache/
    ├── LruCacheTest.java
    └── TtlCacheTest.java`,
    notes: [
      "LruCache 把淘汰交给 removeEldestEntry，代码最少。",
      "TtlCache 不负责 LRU，只负责过期；职责分开更好测。",
      "ConcurrentCache 用同一把锁保护 map 与计数器，先保证正确再谈优化。",
    ],
  },
  milestones: [
    { title: "M1 LRU 淘汰", desc: "容量满时移除最久未使用条目，访问会刷新顺序。", exIds: ["pr4-1"] },
    { title: "M2 TTL 过期", desc: "注入时间源，到期后 get 返回 null 并移除。", exIds: ["pr4-2"] },
    { title: "M3 命中率统计", desc: "记录 hits / misses，计算 hitRate。", exIds: ["pr4-3"] },
    { title: "M4 并发安全", desc: "多线程读写下结构不坏、计数不丢。", exIds: ["pr4-4"] },
  ],
  exercises: [
    {
      id: "pr4-1",
      kind: "code",
      title: "实现 LRU 淘汰",
      difficulty: "★★★",
      prompt:
        "补全 <code>LruCache&lt;K,V&gt;</code>：容量必须大于 0；key/value 不能为 null；<code>get</code> 未命中返回 null，命中会刷新访问顺序；<code>put</code> 超出容量时淘汰最久未使用的条目。<code>size()</code> 已给出。",
      starter: String.raw`import java.util.*;

class LruCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> map;

    LruCache(int capacity) {
        // TODO: 校验容量
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(16, 0.75f, true);
    }

    void put(K key, V value) {
        // TODO
    }

    V get(K key) {
        // TODO
        return null;
    }

    int size() {
        return map.size();
    }
}

public class Main {
    public static void main(String[] args) {
        LruCache<String, Integer> cache = new LruCache<>(2);
        cache.put("a", 1);
        cache.put("b", 2);
        System.out.println(cache.get("a"));
    }
}`,
      hints: [
        "在构造器里把 <code>new LinkedHashMap&lt;&gt;(16, 0.75f, true)</code> 改成匿名子类，重写 <code>removeEldestEntry</code>。",
        "或者 put 后手动 <code>if (map.size() &gt; capacity) map.remove(map.keySet().iterator().next())</code>。",
        "get 直接返回 <code>map.get(key)</code>，accessOrder=true 会自动刷新顺序。",
      ],
      solution: String.raw`import java.util.*;

class LruCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> map;

    LruCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("容量必须大于 0");
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > LruCache.this.capacity;
            }
        };
    }

    void put(K key, V value) {
        if (key == null || value == null) throw new IllegalArgumentException("key/value 不能为 null");
        map.put(key, value);
    }

    V get(K key) {
        return map.get(key);
    }

    int size() {
        return map.size();
    }
}

public class Main {
    public static void main(String[] args) {
        LruCache<String, Integer> cache = new LruCache<>(2);
        cache.put("a", 1);
        cache.put("b", 2);
        System.out.println(cache.get("a"));
    }
}`,
      check: String.raw`        LruCache<String, Integer> cache = new LruCache<>(2);
        cache.put("a", 1);
        cache.put("b", 2);
        eq(cache.get("a"), 1, "a 应命中");
        cache.put("c", 3);
        eq(cache.size(), 2, "容量必须限制在 2");
        eq(cache.get("b"), null, "b 最久未使用，应被淘汰");
        eq(cache.get("a"), 1, "a 刚访问过，应保留");
        eq(cache.get("c"), 3, "c 应存在");
        boolean thrown = false;
        try { new LruCache<String, Integer>(0); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "容量 0 应抛出异常");
        thrown = false;
        try { cache.put(null, 1); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "null key 应抛出异常");`,
    },
    {
      id: "pr4-2",
      kind: "code",
      title: "TTL 过期",
      difficulty: "★★★",
      prompt:
        "补全 <code>TtlCache&lt;K,V&gt;</code>：构造器接收 ttlMillis 和 <code>LongSupplier clock</code>。<code>put</code> 记录当前时间；<code>get</code> 时如果 <code>now - 写入时间 &gt;= ttlMillis</code>，删除条目并返回 null。ttlMillis 必须大于 0，key/value 不能为 null。",
      starter: String.raw`import java.util.*;
import java.util.function.LongSupplier;

class TtlCache<K, V> {
    private final long ttlMillis;
    private final LongSupplier clock;
    private final Map<K, V> values = new HashMap<>();
    private final Map<K, Long> writtenAt = new HashMap<>();

    TtlCache(long ttlMillis, LongSupplier clock) {
        // TODO: 校验 ttl 与 clock
        this.ttlMillis = ttlMillis;
        this.clock = clock;
    }

    void put(K key, V value) {
        // TODO
    }

    V get(K key) {
        // TODO
        return null;
    }

    int size() {
        return values.size();
    }
}

public class Main {
    public static void main(String[] args) {
        TtlCache<String, String> cache = new TtlCache<>(1000, System::currentTimeMillis);
        cache.put("k", "v");
        System.out.println(cache.get("k"));
    }
}`,
      hints: [
        "<code>writtenAt.put(key, clock.getAsLong())</code>。",
        "get 先取写入时间；为 null 说明不存在，直接返回 null。",
        "过期判断用 <code>clock.getAsLong() - start &gt;= ttlMillis</code>，然后同时删除两个 map 里的键。",
      ],
      solution: String.raw`import java.util.*;
import java.util.function.LongSupplier;

class TtlCache<K, V> {
    private final long ttlMillis;
    private final LongSupplier clock;
    private final Map<K, V> values = new HashMap<>();
    private final Map<K, Long> writtenAt = new HashMap<>();

    TtlCache(long ttlMillis, LongSupplier clock) {
        if (ttlMillis <= 0) throw new IllegalArgumentException("ttl 必须大于 0");
        if (clock == null) throw new IllegalArgumentException("clock 不能为 null");
        this.ttlMillis = ttlMillis;
        this.clock = clock;
    }

    void put(K key, V value) {
        if (key == null || value == null) throw new IllegalArgumentException("key/value 不能为 null");
        values.put(key, value);
        writtenAt.put(key, clock.getAsLong());
    }

    V get(K key) {
        Long start = writtenAt.get(key);
        if (start == null) return null;
        if (clock.getAsLong() - start >= ttlMillis) {
            values.remove(key);
            writtenAt.remove(key);
            return null;
        }
        return values.get(key);
    }

    int size() {
        return values.size();
    }
}

public class Main {
    public static void main(String[] args) {
        TtlCache<String, String> cache = new TtlCache<>(1000, System::currentTimeMillis);
        cache.put("k", "v");
        System.out.println(cache.get("k"));
    }
}`,
      check: String.raw`        AtomicLong now = new AtomicLong(1000);
        TtlCache<String, String> cache = new TtlCache<>(1000, now::get);
        cache.put("k", "v");
        eq(cache.get("k"), "v", "刚写入应命中");
        now.addAndGet(999);
        eq(cache.get("k"), "v", "未到 TTL 应仍然有效");
        now.addAndGet(1);
        eq(cache.get("k"), null, "达到 TTL 应过期");
        eq(cache.size(), 0, "过期后应被移除");
        boolean thrown = false;
        try { new TtlCache<String, String>(0, now::get); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "ttl=0 应抛出异常");`,
    },
    {
      id: "pr4-3",
      kind: "code",
      title: "命中率统计",
      difficulty: "★★☆",
      prompt:
        "在 <code>LruCache</code> 中增加统计：每次 <code>get</code> 命中时 hits 加一，未命中时 misses 加一；<code>hitRate()</code> 返回 0~1 的小数，没有任何请求时返回 0。保留原来的 LRU 淘汰行为。",
      starter: String.raw`import java.util.*;

class LruCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> map;
    private int hits;
    private int misses;

    LruCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("容量必须大于 0");
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(16, 0.75f, true);
    }

    void put(K key, V value) {
        map.put(key, value);
        if (map.size() > capacity) {
            K eldest = map.keySet().iterator().next();
            map.remove(eldest);
        }
    }

    V get(K key) {
        // TODO: 统计命中/未命中
        return map.get(key);
    }

    int hits() { return hits; }
    int misses() { return misses; }

    double hitRate() {
        // TODO
        return 0;
    }

    int size() { return map.size(); }
}

public class Main {
    public static void main(String[] args) {
        LruCache<String, Integer> cache = new LruCache<>(3);
        cache.put("a", 1);
        cache.get("a");
        System.out.println(cache.hitRate());
    }
}`,
      hints: [
        "先 <code>V value = map.get(key)</code>，根据是否为 null 更新计数。",
        "注意：值本身不允许为 null（上一题已约束），所以 null 一定代表未命中。",
        "hitRate：总请求为 0 时返回 0，否则 <code>(double) hits / (hits + misses)</code>。",
      ],
      solution: String.raw`import java.util.*;

class LruCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> map;
    private int hits;
    private int misses;

    LruCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("容量必须大于 0");
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(16, 0.75f, true);
    }

    void put(K key, V value) {
        if (key == null || value == null) throw new IllegalArgumentException("key/value 不能为 null");
        map.put(key, value);
        if (map.size() > capacity) {
            K eldest = map.keySet().iterator().next();
            map.remove(eldest);
        }
    }

    V get(K key) {
        V value = map.get(key);
        if (value == null) misses++;
        else hits++;
        return value;
    }

    int hits() { return hits; }
    int misses() { return misses; }

    double hitRate() {
        int total = hits + misses;
        return total == 0 ? 0 : (double) hits / total;
    }

    int size() { return map.size(); }
}

public class Main {
    public static void main(String[] args) {
        LruCache<String, Integer> cache = new LruCache<>(3);
        cache.put("a", 1);
        cache.get("a");
        System.out.println(cache.hitRate());
    }
}`,
      check: String.raw`        LruCache<String, Integer> cache = new LruCache<>(2);
        near(cache.hitRate(), 0.0, 1e-9, "没有请求时命中率为 0");
        cache.put("a", 1);
        cache.put("b", 2);
        eq(cache.get("a"), 1, "命中 a");
        eq(cache.get("x"), null, "未命中 x");
        eq(cache.get("b"), 2, "命中 b");
        eq(cache.get("y"), null, "未命中 y");
        eq(cache.hits(), 2, "hits 应为 2");
        eq(cache.misses(), 2, "misses 应为 2");
        near(cache.hitRate(), 0.5, 1e-9, "命中率 2/4 = 0.5");`,
    },
    {
      id: "pr4-4",
      kind: "code",
      title: "并发安全的 LRU",
      difficulty: "★★★",
      prompt:
        "补全 <code>ConcurrentCache&lt;K,V&gt;</code>，让它在 8 个线程并发读写时：结构不损坏、size 不超过容量、hits + misses 等于实际 get 次数。用 <code>synchronized</code> 保护所有公共方法。",
      starter: String.raw`import java.util.*;

class ConcurrentCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> map;
    private int hits;
    private int misses;

    ConcurrentCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("容量必须大于 0");
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(16, 0.75f, true);
    }

    // TODO: 给方法加 synchronized，并完成 LRU 与统计
    void put(K key, V value) {
        map.put(key, value);
    }

    V get(K key) {
        return map.get(key);
    }

    int hits() { return hits; }
    int misses() { return misses; }
    int size() { return map.size(); }
}

public class Main {
    public static void main(String[] args) throws Exception {
        ConcurrentCache<Integer, Integer> cache = new ConcurrentCache<>(100);
        for (int i = 0; i < 100; i++) cache.put(i, i);
        System.out.println(cache.size());
    }
}`,
      hints: [
        "所有方法加 <code>synchronized</code>，先保证正确性。",
        "get 里更新 hits/misses；put 后淘汰队头。",
        "不要在 synchronized 方法里做耗时操作（日志、IO），锁会被占住。",
      ],
      solution: String.raw`import java.util.*;

class ConcurrentCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> map;
    private int hits;
    private int misses;

    ConcurrentCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("容量必须大于 0");
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(16, 0.75f, true);
    }

    synchronized void put(K key, V value) {
        if (key == null || value == null) throw new IllegalArgumentException("key/value 不能为 null");
        map.put(key, value);
        if (map.size() > capacity) {
            K eldest = map.keySet().iterator().next();
            map.remove(eldest);
        }
    }

    synchronized V get(K key) {
        V value = map.get(key);
        if (value == null) misses++;
        else hits++;
        return value;
    }

    synchronized int hits() { return hits; }
    synchronized int misses() { return misses; }
    synchronized int size() { return map.size(); }
}

public class Main {
    public static void main(String[] args) throws Exception {
        ConcurrentCache<Integer, Integer> cache = new ConcurrentCache<>(100);
        for (int i = 0; i < 100; i++) cache.put(i, i);
        System.out.println(cache.size());
    }
}`,
      check: String.raw`        ConcurrentCache<Integer, Integer> cache = new ConcurrentCache<>(64);
        for (int i = 0; i < 64; i++) cache.put(i, i);

        int threads = 8, perThread = 500;
        int expectedGets = threads * perThread;
        Thread[] ts = new Thread[threads];
        for (int i = 0; i < threads; i++) {
            final int base = i;
            ts[i] = new Thread(() -> {
                for (int j = 0; j < perThread; j++) {
                    int key = (base * 7 + j) % 64;
                    cache.get(key);
                }
            });
            ts[i].start();
        }
        for (Thread t : ts) t.join();
        eq(cache.hits() + cache.misses(), expectedGets, "hits+misses 应等于并发 get 次数，说明计数丢失或结构损坏");
        eq(cache.misses(), 0, "所有 key 都在缓存里，不应有 miss");
        check(cache.size() <= 64, "size 不能超过容量");`,
    },
  ],
  files: [
    {
      name: "LruCache.java",
      note: "LinkedHashMap 版 LRU + 命中率",
      code: String.raw`package com.example.cache;

import java.util.LinkedHashMap;
import java.util.Map;

public class LruCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> map;
    private int hits;
    private int misses;

    public LruCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("容量必须大于 0");
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(16, 0.75f, true) {
            @Override
            protected boolean removeEldestEntry(Map.Entry<K, V> eldest) {
                return size() > LruCache.this.capacity;
            }
        };
    }

    public void put(K key, V value) {
        if (key == null || value == null) throw new IllegalArgumentException("key/value 不能为 null");
        map.put(key, value);
    }

    public V get(K key) {
        V value = map.get(key);
        if (value == null) misses++;
        else hits++;
        return value;
    }

    public int size() { return map.size(); }
    public int hits() { return hits; }
    public int misses() { return misses; }
    public double hitRate() {
        int total = hits + misses;
        return total == 0 ? 0 : (double) hits / total;
    }
}`,
    },
    {
      name: "TtlCache.java",
      note: "可注入时间源的 TTL 缓存",
      code: String.raw`package com.example.cache;

import java.util.HashMap;
import java.util.Map;
import java.util.function.LongSupplier;

public class TtlCache<K, V> {
    private final long ttlMillis;
    private final LongSupplier clock;
    private final Map<K, V> values = new HashMap<>();
    private final Map<K, Long> writtenAt = new HashMap<>();

    public TtlCache(long ttlMillis, LongSupplier clock) {
        if (ttlMillis <= 0) throw new IllegalArgumentException("ttl 必须大于 0");
        if (clock == null) throw new IllegalArgumentException("clock 不能为 null");
        this.ttlMillis = ttlMillis;
        this.clock = clock;
    }

    public void put(K key, V value) {
        if (key == null || value == null) throw new IllegalArgumentException("key/value 不能为 null");
        values.put(key, value);
        writtenAt.put(key, clock.getAsLong());
    }

    public V get(K key) {
        Long start = writtenAt.get(key);
        if (start == null) return null;
        if (clock.getAsLong() - start >= ttlMillis) {
            values.remove(key);
            writtenAt.remove(key);
            return null;
        }
        return values.get(key);
    }

    public int size() { return values.size(); }
}`,
    },
    {
      name: "ConcurrentCache.java",
      note: "先正确后性能：synchronized 版",
      code: String.raw`package com.example.cache;

import java.util.LinkedHashMap;

public class ConcurrentCache<K, V> {
    private final int capacity;
    private final LinkedHashMap<K, V> map;
    private int hits;
    private int misses;

    public ConcurrentCache(int capacity) {
        if (capacity <= 0) throw new IllegalArgumentException("容量必须大于 0");
        this.capacity = capacity;
        this.map = new LinkedHashMap<>(16, 0.75f, true);
    }

    public synchronized void put(K key, V value) {
        if (key == null || value == null) throw new IllegalArgumentException("key/value 不能为 null");
        map.put(key, value);
        if (map.size() > capacity) {
            K eldest = map.keySet().iterator().next();
            map.remove(eldest);
        }
    }

    public synchronized V get(K key) {
        V value = map.get(key);
        if (value == null) misses++;
        else hits++;
        return value;
    }

    public synchronized int size() { return map.size(); }
    public synchronized int hits() { return hits; }
    public synchronized int misses() { return misses; }
}`,
    },
    {
      name: "Main.java",
      note: "演示 + 简单压测入口",
      code: String.raw`package com.example.cache;

public class Main {
    public static void main(String[] args) throws Exception {
        LruCache<String, Integer> cache = new LruCache<>(3);
        cache.put("a", 1);
        cache.put("b", 2);
        cache.put("c", 3);
        cache.get("a");
        cache.put("d", 4);
        System.out.println("b 是否被淘汰：" + (cache.get("b") == null));
        System.out.println("命中率：" + cache.hitRate());

        ConcurrentCache<Integer, Integer> safe = new ConcurrentCache<>(100);
        Thread[] threads = new Thread[8];
        for (int t = 0; t < threads.length; t++) {
            final int id = t;
            threads[t] = new Thread(() -> {
                for (int i = 0; i < 1000; i++) safe.put(id * 1000 + i, i);
            });
            threads[t].start();
        }
        for (Thread th : threads) th.join();
        System.out.println("并发后 size：" + safe.size());
    }
}`,
    },
  ],
  localSetup: [
    "mkdir -p cache-lab/src/main/java/com/example/cache",
    "放入 4 个参考文件",
    "javac -d out $(find src/main/java -name '*.java')",
    "java -cp out com.example.cache.Main",
  ],
  localNotes: [
    "用 JUnit 测 TTL 时传可推进的 LongSupplier，不要 Thread.sleep。",
    "压测并发版时观察 hits+misses 是否等于 get 次数，这是最简单的正确性断言。",
  ],
  extensions: [
    "过期清理：后台线程定期扫描过期 key，避免只在 get 时清理。",
    "LFU 淘汰：按访问频率而不是最近访问时间淘汰。",
    "分段锁：把 key 哈希到多个 LinkedHashMap，降低锁竞争。",
    "缓存加载器：get 未命中时自动 load（CacheLoader），注意防止缓存击穿。",
  ],
  refs: [
    { name: "GitHub: Snailclimb/JavaGuide · 缓存", url: "https://github.com/Snailclimb/JavaGuide", why: "LRU、TTL、缓存穿透/击穿/雪崩的系统整理。" },
    { name: "《Java 并发编程实战》第 5 章", url: "https://www.ituring.com.cn/search?q=Java并发编程实战", why: "并发集合与锁的适用范围。" },
    { name: "LinkedHashMap JDK 文档", url: "https://docs.oracle.com/en/java/javase/21/docs/api/java.base/java/util/LinkedHashMap.html", why: "accessOrder 与 removeEldestEntry 的官方说明。" },
  ],
});
