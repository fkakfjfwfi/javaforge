/* 项目 05 · BankCore 账户与转账
   BigDecimal 金额、转账原子性、幂等、审计流水、并发一致性。练的是“钱不能算错”。 */
window.PROJECTS = window.PROJECTS || [];
window.PROJECTS.push({
  id: "bank-core",
  index: "05",
  type: "project",
  title: "BankCore 账户与转账引擎",
  subtitle: "BigDecimal、幂等与并发一致性",
  summary:
    "账户余额必须精确、转账要么全成功要么全不变、重复请求不能扣两次钱。这个项目把这些“钱的规则”写成可判题的代码。",
  level: "进阶项目",
  duration: "6–8 小时",
  mode: "core",
  modeLabel: "金额 / 并发",
  accent: "#2f6488",
  stack: ["BigDecimal", "事务语义", "幂等", "并发", "审计"],
  resumeLine: "实现 BigDecimal 账户模型与幂等转账服务，保证并发下资金总额守恒",
  resume: {
    keywords: ["BigDecimal", "事务", "幂等", "并发安全", "审计日志"],
    bullets: [
      "用 BigDecimal 表示金额，构造器与存取款方法统一校验，杜绝浮点误差与负余额。",
      "实现幂等转账：requestId 去重，重复请求直接返回 DUPLICATE，不重复扣款。",
      "通过锁顺序 / 同步控制保证并发转账后总资金守恒，最终余额精确可验证。",
      "记录审计流水并输出汇总报表，为对账与排障提供依据。",
    ],
  },
  highlights: [
    "金额永远不用 double：0.1 + 0.2 的教训在金融场景是事故。",
    "幂等键是支付系统的生命线：网络重试、用户连点都会产生重复请求。",
    "转账的原子性不是“先扣再存”这么简单，失败必须回滚。",
    "并发一致性用总额守恒做断言，比单看某个账户更可靠。",
  ],
  sections: [
    { type: "h", text: "金额：BigDecimal 的三条硬规矩" },
    {
      type: "list",
      items: [
        "用字符串构造：<code>new BigDecimal(\"0.10\")</code>，不要传 double。",
        "比较用 <code>compareTo</code>，不要用 <code>equals</code>（scale 不同会判不等）。",
        "展示用 <code>setScale(2, RoundingMode.HALF_UP)</code>，不要用 <code>doubleValue()</code> 再格式化。",
      ],
    },
    {
      type: "code",
      file: "MoneyRules.java",
      code: String.raw`BigDecimal a = new BigDecimal("0.10");
BigDecimal b = new BigDecimal("0.20");
System.out.println(a.add(b));                 // 0.30

BigDecimal x = new BigDecimal("1.0");
BigDecimal y = new BigDecimal("1.00");
System.out.println(x.equals(y));              // false，scale 不同
System.out.println(x.compareTo(y) == 0);      // true，数值相同`,
      output: "0.30\nfalse\ntrue",
    },
    { type: "h", text: "转账的原子语义" },
    {
      type: "p",
      html: "一次转账包含：校验金额 → 校验余额 → 扣款 → 入账 → 记录流水。任何一步失败，前面已经发生的修改都必须撤销。真实系统用数据库事务；这里用代码模拟“先校验、后修改、失败回滚”的顺序。",
    },
    {
      type: "callout",
      tone: "warn",
      title: "先扣款再校验入账，是事故的起点",
      html: "如果目标账户不存在或已冻结，扣款必须回滚。更稳妥的顺序是：先把所有校验做完（账户状态、限额、风控），再做两次余额修改，最后写流水。修改阶段尽量只保留不会失败的操作。",
    },
    { type: "h", text: "幂等：同一个 requestId 只能成功一次" },
    {
      type: "p",
      html: "客户端超时重试、用户连点、消息队列重复投递，都会让同一个请求到达多次。用 <code>requestId</code> 做幂等键：第一次成功记录该键，之后相同键直接返回“已处理”，不再动余额。",
    },
    {
      type: "code",
      file: "Idempotent.java",
      code: String.raw`String transfer(Account from, Account to, BigDecimal amount, String requestId) {
    if (processed.containsKey(requestId)) return "DUPLICATE";
    // 校验、扣款、入账...
    processed.put(requestId, "OK");
    return "OK";
}`,
    },
    {
      type: "callout",
      tone: "deep",
      title: "生产环境的幂等更复杂",
      html: "单机 Map 只适合练习。生产要用数据库唯一索引 / Redis SETNX，并考虑“处理中”状态、超时重试、最终一致性。幂等键通常由客户端生成，服务端不能自己造。",
    },
    { type: "h", text: "并发：锁顺序避免死锁" },
    {
      type: "p",
      html: "A→B 和 B→A 同时发生，如果各自先锁自己的账户再锁对方，就会循环等待死锁。工程上的标准解法是：<strong>按账户 ID 排序后加锁</strong>，所有线程遵循同一顺序。练习版用 <code>synchronized</code> 方法简化，先保证正确。",
    },
    {
      type: "table",
      head: ["方案", "优点", "代价"],
      rows: [
        ["synchronized 整个 transfer", "实现最简单，绝对正确", "吞吐低，所有转账串行"],
        ["按账户 ID 顺序加锁", "并发度高，无死锁", "实现复杂，需处理锁释放"],
        ["数据库事务 + 行锁", "生产标准", "依赖数据库，需处理隔离级别"],
      ],
    },
    { type: "h", text: "审计流水：对账的依据" },
    {
      type: "list",
      items: [
        "每笔转账记录：requestId、from、to、金额、状态、时间。",
        "流水只追加，不修改；冲正用反向流水，而不是改历史。",
        "金额、账户 ID 必须能索引，方便按用户/时间对账。",
        "汇总报表要和账户余额对得上，否则就是有交易没入账。",
      ],
    },
  ],
  architecture: {
    tree: `bank-core/
├── src/main/java/com/example/bank/
│   ├── domain/Account.java        # BigDecimal 余额与校验
│   ├── service/TransferService.java  # 幂等 + 锁 + 回滚
│   ├── audit/Ledger.java          # 只追加流水
│   └── Main.java                  # 演示并发转账
└── src/test/java/com/example/bank/
    ├── AccountTest.java
    └── TransferServiceTest.java`,
    notes: [
      "Account 自己守住余额非负，服务层不再重复判断。",
      "TransferService 负责编排：幂等检查 → 校验 → 修改 → 流水。",
      "Ledger 只负责记录与汇总，不碰余额。",
      "并发测试用总额守恒断言，而不是只看单个账户。",
    ],
  },
  milestones: [
    { title: "M1 账户模型", desc: "BigDecimal 金额、构造器校验、存取款不允许负余额。", exIds: ["pr5-1"] },
    { title: "M2 幂等转账", desc: "requestId 去重，余额不足不改变任何账户。", exIds: ["pr5-2"] },
    { title: "M3 并发一致性", desc: "多线程转账后总资金守恒，余额精确。", exIds: ["pr5-3"] },
    { title: "M4 审计流水", desc: "记录每笔交易并输出汇总报表。", exIds: ["pr5-4"] },
  ],
  exercises: [
    {
      id: "pr5-1",
      kind: "code",
      title: "BigDecimal 账户",
      difficulty: "★★☆",
      prompt:
        "补全 <code>Account</code>：id 不能为 null/空白；初始余额不能为负；<code>deposit</code> 与 <code>withdraw</code> 金额必须大于 0；取款不能超过余额，否则抛 <code>IllegalArgumentException</code>。余额用 <code>BigDecimal</code> 保存。",
      starter: String.raw`import java.math.BigDecimal;

class Account {
    private final String id;
    private BigDecimal balance;

    Account(String id, BigDecimal initialBalance) {
        // TODO: 校验
        this.id = id;
        this.balance = initialBalance;
    }

    String id() { return id; }
    BigDecimal balance() { return balance; }

    void deposit(BigDecimal amount) {
        // TODO
    }

    void withdraw(BigDecimal amount) {
        // TODO
    }
}

public class Main {
    public static void main(String[] args) {
        Account a = new Account("A1001", new BigDecimal("100.00"));
        a.deposit(new BigDecimal("0.10"));
        System.out.println(a.balance().toPlainString());
    }
}`,
      hints: [
        "金额校验：<code>amount == null || amount.compareTo(BigDecimal.ZERO) &lt;= 0</code>。",
        "余额判断用 <code>balance.compareTo(amount) &lt; 0</code>。",
        "加法用 <code>balance = balance.add(amount)</code>，减法用 <code>subtract</code>。",
      ],
      solution: String.raw`import java.math.BigDecimal;

class Account {
    private final String id;
    private BigDecimal balance;

    Account(String id, BigDecimal initialBalance) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("账户 ID 不能为空");
        if (initialBalance == null || initialBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("初始余额不能为负");
        }
        this.id = id;
        this.balance = initialBalance;
    }

    String id() { return id; }
    BigDecimal balance() { return balance; }

    void deposit(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("金额必须大于 0");
        }
        balance = balance.add(amount);
    }

    void withdraw(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("金额必须大于 0");
        }
        if (balance.compareTo(amount) < 0) {
            throw new IllegalArgumentException("余额不足");
        }
        balance = balance.subtract(amount);
    }
}

public class Main {
    public static void main(String[] args) {
        Account a = new Account("A1001", new BigDecimal("100.00"));
        a.deposit(new BigDecimal("0.10"));
        System.out.println(a.balance().toPlainString());
    }
}`,
      check: String.raw`        Account a = new Account("A1001", new BigDecimal("100.00"));
        eq(a.balance().toPlainString(), "100.00", "初始余额");
        a.deposit(new BigDecimal("0.10"));
        eq(a.balance().toPlainString(), "100.10", "BigDecimal 精确加法");
        a.deposit(new BigDecimal("0.20"));
        eq(a.balance().toPlainString(), "100.30", "0.1 + 0.2 不应有浮点误差");
        a.withdraw(new BigDecimal("30.30"));
        eq(a.balance().toPlainString(), "70.00", "取款后余额");
        boolean thrown = false;
        try { a.withdraw(new BigDecimal("1000")); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "余额不足应抛出异常");
        thrown = false;
        try { new Account(" ", BigDecimal.ZERO); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "空白 ID 应抛出异常");`,
    },
    {
      id: "pr5-2",
      kind: "code",
      title: "幂等转账",
      difficulty: "★★★",
      prompt:
        "补全 <code>TransferService.transfer</code>：校验金额大于 0、requestId 非空；同一个 requestId 第二次调用返回 <code>DUPLICATE</code> 且不动余额；余额不足抛 <code>IllegalArgumentException</code> 且两个账户余额都不变；成功返回 <code>OK</code>。",
      starter: String.raw`import java.math.BigDecimal;
import java.util.*;

class Account {
    private final String id;
    private BigDecimal balance;

    Account(String id, BigDecimal initial) {
        this.id = id;
        this.balance = initial;
    }

    String id() { return id; }
    BigDecimal balance() { return balance; }
    void deposit(BigDecimal amount) { balance = balance.add(amount); }
    void withdraw(BigDecimal amount) { balance = balance.subtract(amount); }
}

class TransferService {
    private final Map<String, String> processed = new HashMap<>();

    String transfer(Account from, Account to, BigDecimal amount, String requestId) {
        // TODO: 幂等 → 校验 → 扣款 → 入账
        return "";
    }
}

public class Main {
    public static void main(String[] args) {
        Account a = new Account("A", new BigDecimal("100"));
        Account b = new Account("B", new BigDecimal("0"));
        System.out.println(new TransferService().transfer(a, b, new BigDecimal("30"), "r1"));
    }
}`,
      hints: [
        "先判 <code>processed.containsKey(requestId)</code>，再校验金额和余额。",
        "余额不足要在扣款前判断：<code>from.balance().compareTo(amount) &lt; 0</code>。",
        "成功后 <code>processed.put(requestId, ...)</code>。",
      ],
      solution: String.raw`import java.math.BigDecimal;
import java.util.*;

class Account {
    private final String id;
    private BigDecimal balance;

    Account(String id, BigDecimal initial) {
        this.id = id;
        this.balance = initial;
    }

    String id() { return id; }
    BigDecimal balance() { return balance; }
    void deposit(BigDecimal amount) { balance = balance.add(amount); }
    void withdraw(BigDecimal amount) { balance = balance.subtract(amount); }
}

class TransferService {
    private final Map<String, String> processed = new HashMap<>();

    String transfer(Account from, Account to, BigDecimal amount, String requestId) {
        if (from == null || to == null || amount == null) {
            throw new IllegalArgumentException("账户与金额不能为 null");
        }
        if (requestId == null || requestId.isBlank()) {
            throw new IllegalArgumentException("requestId 不能为空");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("金额必须大于 0");
        }
        if (processed.containsKey(requestId)) return "DUPLICATE";
        if (from.balance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("余额不足");
        }

        from.withdraw(amount);
        try {
            to.deposit(amount);
        } catch (RuntimeException e) {
            from.deposit(amount);   // 模拟回滚
            throw e;
        }
        processed.put(requestId, "OK");
        return "OK";
    }
}

public class Main {
    public static void main(String[] args) {
        Account a = new Account("A", new BigDecimal("100"));
        Account b = new Account("B", new BigDecimal("0"));
        System.out.println(new TransferService().transfer(a, b, new BigDecimal("30"), "r1"));
    }
}`,
      check: String.raw`        Account a = new Account("A", new BigDecimal("100"));
        Account b = new Account("B", new BigDecimal("0"));
        TransferService service = new TransferService();

        eq(service.transfer(a, b, new BigDecimal("30"), "r1"), "OK", "首次转账应成功");
        eq(a.balance().toPlainString(), "70", "A 扣款后余额");
        eq(b.balance().toPlainString(), "30", "B 入账后余额");

        eq(service.transfer(a, b, new BigDecimal("10"), "r1"), "DUPLICATE", "重复 requestId 应返回 DUPLICATE");
        eq(a.balance().toPlainString(), "70", "重复请求不能再次扣款");
        eq(b.balance().toPlainString(), "30", "重复请求不能再次入账");

        eq(service.transfer(a, b, new BigDecimal("10"), "r2"), "OK", "新 requestId 应成功");
        eq(a.balance().toPlainString(), "60", "第二笔后 A 余额");

        boolean thrown = false;
        try { service.transfer(a, b, new BigDecimal("1000"), "r3"); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "余额不足应抛出异常");
        eq(a.balance().toPlainString(), "60", "失败后 A 余额不变");
        eq(b.balance().toPlainString(), "40", "失败后 B 余额不变");`,
    },
    {
      id: "pr5-3",
      kind: "code",
      title: "并发转账：总额守恒",
      difficulty: "★★★",
      prompt:
        "让 <code>TransferService</code> 在并发下正确：8 个线程各执行 100 次 1 元转账（A→B，requestId 唯一），最终 A 9200、B 800、总额 10000 不变。可以给 <code>transfer</code> 加 <code>synchronized</code>。",
      starter: String.raw`import java.math.BigDecimal;
import java.util.*;

class Account {
    private BigDecimal balance;

    Account(BigDecimal initial) { this.balance = initial; }
    BigDecimal balance() { return balance; }
    void deposit(BigDecimal amount) { balance = balance.add(amount); }
    void withdraw(BigDecimal amount) { balance = balance.subtract(amount); }
}

class TransferService {
    private final Map<String, String> processed = new HashMap<>();

    String transfer(Account from, Account to, BigDecimal amount, String requestId) {
        if (processed.containsKey(requestId)) return "DUPLICATE";
        if (from.balance().compareTo(amount) < 0) throw new IllegalArgumentException("余额不足");
        from.withdraw(amount);
        to.deposit(amount);
        processed.put(requestId, "OK");
        return "OK";
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        Account a = new Account(new BigDecimal("10000"));
        Account b = new Account(BigDecimal.ZERO);
        TransferService service = new TransferService();
        Thread[] threads = new Thread[8];
        for (int i = 0; i < 8; i++) {
            final int base = i;
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 100; j++) {
                    service.transfer(a, b, BigDecimal.ONE, base + "-" + j);
                }
            });
            threads[i].start();
        }
        for (Thread t : threads) t.join();
        System.out.println(a.balance() + " / " + b.balance());
    }
}`,
      hints: [
        "最简单：<code>synchronized String transfer(...)</code>。",
        "生产级：按账户 ID 顺序加锁，避免 A→B 与 B→A 死锁。",
        "processed 也是共享状态，必须同一把锁保护。",
      ],
      solution: String.raw`import java.math.BigDecimal;
import java.util.*;

class Account {
    private BigDecimal balance;

    Account(BigDecimal initial) { this.balance = initial; }
    BigDecimal balance() { return balance; }
    void deposit(BigDecimal amount) { balance = balance.add(amount); }
    void withdraw(BigDecimal amount) { balance = balance.subtract(amount); }
}

class TransferService {
    private final Map<String, String> processed = new HashMap<>();

    synchronized String transfer(Account from, Account to, BigDecimal amount, String requestId) {
        if (processed.containsKey(requestId)) return "DUPLICATE";
        if (from.balance().compareTo(amount) < 0) throw new IllegalArgumentException("余额不足");
        from.withdraw(amount);
        to.deposit(amount);
        processed.put(requestId, "OK");
        return "OK";
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        Account a = new Account(new BigDecimal("10000"));
        Account b = new Account(BigDecimal.ZERO);
        TransferService service = new TransferService();
        Thread[] threads = new Thread[8];
        for (int i = 0; i < 8; i++) {
            final int base = i;
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 100; j++) {
                    service.transfer(a, b, BigDecimal.ONE, base + "-" + j);
                }
            });
            threads[i].start();
        }
        for (Thread t : threads) t.join();
        System.out.println(a.balance() + " / " + b.balance());
    }
}`,
      check: String.raw`        Account a = new Account(new BigDecimal("10000"));
        Account b = new Account(BigDecimal.ZERO);
        TransferService service = new TransferService();
        int threads = 8, perThread = 100;
        Thread[] ts = new Thread[threads];
        for (int i = 0; i < threads; i++) {
            final int base = i;
            ts[i] = new Thread(() -> {
                for (int j = 0; j < perThread; j++) {
                    service.transfer(a, b, BigDecimal.ONE, base + "-" + j);
                }
            });
            ts[i].start();
        }
        for (Thread t : ts) t.join();
        eq(a.balance().toPlainString(), "9200", "A 应剩 9200");
        eq(b.balance().toPlainString(), "800", "B 应为 800");
        eq(a.balance().add(b.balance()).toPlainString(), "10000", "总资金必须守恒");`,
    },
    {
      id: "pr5-4",
      kind: "code",
      title: "审计流水与汇总",
      difficulty: "★★☆",
      prompt:
        "补全 <code>Ledger</code>：<code>record</code> 追加一条流水（requestId 不能为空，金额必须大于 0）；<code>entries()</code> 返回副本；<code>summary()</code> 返回 <code>成功 N 笔 | 总额 X</code>，X 用 <code>toPlainString()</code>，只统计状态为 <code>OK</code> 的流水。",
      starter: String.raw`import java.math.BigDecimal;
import java.util.*;

record Entry(String requestId, String from, String to, BigDecimal amount, String status) {}

class Ledger {
    private final List<Entry> entries = new ArrayList<>();

    void record(String requestId, String from, String to, BigDecimal amount, String status) {
        // TODO
    }

    List<Entry> entries() {
        // TODO
        return List.of();
    }

    String summary() {
        // TODO
        return "";
    }
}

public class Main {
    public static void main(String[] args) {
        Ledger ledger = new Ledger();
        ledger.record("r1", "A", "B", new BigDecimal("10.00"), "OK");
        System.out.println(ledger.summary());
    }
}`,
      hints: [
        "<code>entries.add(new Entry(...))</code>。",
        "副本：<code>new ArrayList&lt;&gt;(entries)</code> 或 <code>List.copyOf(entries)</code>。",
        "汇总前先 <code>filter(e -&gt; e.status().equals(\"OK\"))</code>，金额用 <code>reduce(BigDecimal.ZERO, BigDecimal::add)</code>。",
      ],
      solution: String.raw`import java.math.BigDecimal;
import java.util.*;

record Entry(String requestId, String from, String to, BigDecimal amount, String status) {}

class Ledger {
    private final List<Entry> entries = new ArrayList<>();

    void record(String requestId, String from, String to, BigDecimal amount, String status) {
        if (requestId == null || requestId.isBlank()) throw new IllegalArgumentException("requestId 不能为空");
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("金额必须大于 0");
        }
        entries.add(new Entry(requestId, from, to, amount, status == null ? "UNKNOWN" : status));
    }

    List<Entry> entries() {
        return List.copyOf(entries);
    }

    String summary() {
        List<Entry> ok = entries.stream().filter(e -> e.status().equals("OK")).toList();
        BigDecimal total = ok.stream()
                .map(Entry::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return "成功 " + ok.size() + " 笔 | 总额 " + total.toPlainString();
    }
}

public class Main {
    public static void main(String[] args) {
        Ledger ledger = new Ledger();
        ledger.record("r1", "A", "B", new BigDecimal("10.00"), "OK");
        System.out.println(ledger.summary());
    }
}`,
      check: String.raw`        Ledger ledger = new Ledger();
        ledger.record("r1", "A", "B", new BigDecimal("10.00"), "OK");
        ledger.record("r2", "A", "B", new BigDecimal("20.00"), "OK");
        ledger.record("r3", "A", "B", new BigDecimal("5.00"), "FAILED");
        eq(ledger.entries().size(), 3, "应记录三条流水");
        eq(ledger.summary(), "成功 2 笔 | 总额 30.00", "只统计 OK，金额精确");
        Ledger empty = new Ledger();
        eq(empty.summary(), "成功 0 笔 | 总额 0", "空账本汇总");
        eq(empty.entries(), List.of(), "空账本应返回空列表");
        boolean thrown = false;
        try { ledger.record(" ", "A", "B", BigDecimal.ONE, "OK"); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "空白 requestId 应抛出异常");`,
    },
  ],
  files: [
    {
      name: "domain/Account.java",
      note: "金额精确、余额非负",
      code: String.raw`package com.example.bank.domain;

import java.math.BigDecimal;

public class Account {
    private final String id;
    private BigDecimal balance;

    public Account(String id, BigDecimal initialBalance) {
        if (id == null || id.isBlank()) throw new IllegalArgumentException("账户 ID 不能为空");
        if (initialBalance == null || initialBalance.compareTo(BigDecimal.ZERO) < 0) {
            throw new IllegalArgumentException("初始余额不能为负");
        }
        this.id = id;
        this.balance = initialBalance;
    }

    public void deposit(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("金额必须大于 0");
        }
        balance = balance.add(amount);
    }

    public void withdraw(BigDecimal amount) {
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("金额必须大于 0");
        }
        if (balance.compareTo(amount) < 0) throw new IllegalArgumentException("余额不足");
        balance = balance.subtract(amount);
    }

    public String id() { return id; }
    public BigDecimal balance() { return balance; }
}`,
    },
    {
      name: "service/TransferService.java",
      note: "幂等 + 同步 + 失败回滚",
      code: String.raw`package com.example.bank.service;

import com.example.bank.domain.Account;
import java.math.BigDecimal;
import java.util.HashMap;
import java.util.Map;

public class TransferService {
    private final Map<String, String> processed = new HashMap<>();

    public synchronized String transfer(
            Account from, Account to, BigDecimal amount, String requestId) {
        if (from == null || to == null || amount == null) {
            throw new IllegalArgumentException("账户与金额不能为 null");
        }
        if (requestId == null || requestId.isBlank()) {
            throw new IllegalArgumentException("requestId 不能为空");
        }
        if (amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("金额必须大于 0");
        }
        if (processed.containsKey(requestId)) return "DUPLICATE";
        if (from.balance().compareTo(amount) < 0) {
            throw new IllegalArgumentException("余额不足");
        }

        from.withdraw(amount);
        try {
            to.deposit(amount);
        } catch (RuntimeException e) {
            from.deposit(amount);
            throw e;
        }
        processed.put(requestId, "OK");
        return "OK";
    }
}`,
    },
    {
      name: "audit/Ledger.java",
      note: "只追加流水与汇总",
      code: String.raw`package com.example.bank.audit;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;

public class Ledger {
    public record Entry(String requestId, String from, String to,
                        BigDecimal amount, String status) {}

    private final List<Entry> entries = new ArrayList<>();

    public void record(String requestId, String from, String to,
                       BigDecimal amount, String status) {
        if (requestId == null || requestId.isBlank()) {
            throw new IllegalArgumentException("requestId 不能为空");
        }
        if (amount == null || amount.compareTo(BigDecimal.ZERO) <= 0) {
            throw new IllegalArgumentException("金额必须大于 0");
        }
        entries.add(new Entry(requestId, from, to, amount, status));
    }

    public List<Entry> entries() { return List.copyOf(entries); }

    public String summary() {
        List<Entry> ok = entries.stream()
                .filter(e -> "OK".equals(e.status()))
                .toList();
        BigDecimal total = ok.stream()
                .map(Entry::amount)
                .reduce(BigDecimal.ZERO, BigDecimal::add);
        return "成功 " + ok.size() + " 笔 | 总额 " + total.toPlainString();
    }
}`,
    },
    {
      name: "Main.java",
      note: "并发转账演示",
      code: String.raw`package com.example.bank;

import com.example.bank.audit.Ledger;
import com.example.bank.domain.Account;
import com.example.bank.service.TransferService;
import java.math.BigDecimal;

public class Main {
    public static void main(String[] args) throws Exception {
        Account a = new Account("A", new BigDecimal("10000"));
        Account b = new Account("B", BigDecimal.ZERO);
        TransferService service = new TransferService();
        Ledger ledger = new Ledger();

        Thread[] threads = new Thread[8];
        for (int t = 0; t < threads.length; t++) {
            final int id = t;
            threads[t] = new Thread(() -> {
                for (int i = 0; i < 100; i++) {
                    String requestId = id + "-" + i;
                    String status = service.transfer(a, b, BigDecimal.ONE, requestId);
                    ledger.record(requestId, "A", "B", BigDecimal.ONE, status);
                }
            });
            threads[t].start();
        }
        for (Thread th : threads) th.join();

        System.out.println("A=" + a.balance() + ", B=" + b.balance());
        System.out.println(ledger.summary());
    }
}`,
    },
  ],
  localSetup: [
    "mkdir -p bank-core/src/main/java/com/example/bank",
    "放入 4 个参考文件",
    "javac -d out $(find src/main/java -name '*.java')",
    "java -cp out com.example.bank.Main",
  ],
  localNotes: [
    "把 BigDecimal 换成 double 再跑并发测试，会看到总额不再守恒。",
    "用 JUnit 断言 <code>compareTo</code> 而不是 <code>equals</code>，避免 scale 干扰。",
  ],
  extensions: [
    "数据库事务：用 JDBC 把两次余额更新放进同一事务，并加行锁。",
    "多币种：Account 增加 Currency，转账前先做汇率换算并保留 4 位小数。",
    "限额与风控：单笔/日累计限额，超过走审批。",
    "对账任务：每日对比流水汇总与账户余额，差异生成告警。",
  ],
  refs: [
    { name: "《Effective Java》条目 59：了解并避免 BigDecimal 的陷阱", url: "https://www.ituring.com.cn/search?q=Effective%20Java", why: "BigDecimal equals 与 compareTo 的差异、构造方式。" },
    { name: "《阿里巴巴 Java 开发手册》· 浮点数与金额", url: "https://github.com/alibaba/p3c", why: "金额字段类型的强制规约。" },
    { name: "GitHub: Snailclimb/JavaGuide · 并发", url: "https://github.com/Snailclimb/JavaGuide", why: "锁顺序、死锁与并发一致性。" },
  ],
});
