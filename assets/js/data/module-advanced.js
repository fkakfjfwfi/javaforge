/* 模块 03 · 进阶
   泛型、函数式、IO 与时间、并发。四节对应“能写业务”到“能扛住生产”的分水岭。 */
window.CURRICULUM = window.CURRICULUM || { modules: [] };
window.CURRICULUM.modules.push({
  id: "advanced",
  index: "03",
  title: "进阶",
  tagline: "把类型、函数、IO 与并发用对",
  description:
    "这一模块不再讲语法，而是讲设计：泛型让 API 更安全，Stream 让数据处理更表达化，NIO 与 java.time 替代了老 API，并发则决定程序能不能在压力下活下来。",
  accent: "#157066",
  lessons: [
    /* ============================================================ 09 */
    {
      id: "generics",
      title: "泛型：把类型错误拦在编译期",
      summary:
        "泛型不是语法糖，而是编译期的类型契约。理解类型擦除和通配符，才能看懂 JDK 里那些 <code>&lt;T extends Comparable&lt;? super T&gt;&gt;</code> 到底在说什么。",
      level: "进阶",
      minutes: 32,
      objectives: [
        "定义泛型类、泛型方法与有界类型参数",
        "解释类型擦除带来的三个限制",
        "用 ? extends / ? super 写出可复用的 API（PECS 原则）",
        "避免泛型数组、静态上下文误用类型参数等坑",
      ],
      sections: [
        { type: "h", text: "没有泛型时，集合什么都能装" },
        {
          type: "code",
          file: "RawList.java",
          code: String.raw`import java.util.ArrayList;
import java.util.List;

public class RawList {
    public static void main(String[] args) {
        List list = new ArrayList();   // 原始类型，不推荐
        list.add("java");
        list.add(42);

        String s = (String) list.get(1);  // 运行时 ClassCastException
        System.out.println(s);
    }
}`,
          output: "Exception in thread \"main\" java.lang.ClassCastException: class java.lang.Integer cannot be cast to class java.lang.String",
        },
        {
          type: "p",
          html: "泛型的核心收益：把类型检查从运行时提前到编译期。<code>List&lt;String&gt;</code> 里放不进 Integer，取出来也不需要强转。",
        },
        { type: "h", text: "泛型类与泛型方法" },
        {
          type: "code",
          file: "Box.java",
          code: String.raw`class Box<T> {
    private T value;

    void set(T value) { this.value = value; }
    T get() { return value; }
}

public class BoxDemo {
    static <T extends Comparable<T>> T max(T a, T b) {
        return a.compareTo(b) >= 0 ? a : b;
    }

    public static void main(String[] args) {
        Box<String> box = new Box<>();
        box.set("java");
        System.out.println(box.get());

        System.out.println(max(3, 5));
        System.out.println(max("apple", "banana"));
    }
}`,
          output: "java\n5\nbanana",
        },
        {
          type: "list",
          items: [
            "类型参数写在类名后：<code>class Box&lt;T&gt;</code>，可以多个：<code>Map&lt;K, V&gt;</code>。",
            "泛型方法把 <code>&lt;T&gt;</code> 写在返回类型前：<code>static &lt;T&gt; T identity(T value)</code>。",
            "有界参数 <code>&lt;T extends Comparable&lt;T&gt;&gt;</code> 限制 T 必须具备比较能力。",
            "构造时可以用菱形语法 <code>new Box&lt;&gt;()</code>，编译器会推断类型。",
          ],
        },
        { type: "h", text: "类型擦除：运行时其实没有 T" },
        {
          type: "code",
          file: "Erasure.java",
          code: String.raw`import java.util.ArrayList;
import java.util.List;

public class Erasure {
    public static void main(String[] args) {
        List<String> a = new ArrayList<>();
        List<Integer> b = new ArrayList<>();
        System.out.println(a.getClass() == b.getClass());  // true

        // 下面这些都编译不过：
        // T value = new T();          // 不知道 T 的构造器
        // T[] arr = new T[10];        // 运行时不知道 T 是什么
        // if (a instanceof List<String>) { }  // 只能写 List<?>
    }
}`,
          output: "true",
        },
        {
          type: "callout",
          tone: "deep",
          title: "擦除的三个后果",
          html: "1）不能 <code>new T()</code> 或 <code>new T[]</code>；2）不能对泛型类型做 <code>instanceof</code>；3）静态成员不能使用类的类型参数。需要运行时类型时，把 <code>Class&lt;T&gt;</code> 作为参数传进来（类型令牌）。",
        },
        { type: "h", text: "通配符与 PECS" },
        {
          type: "code",
          file: "Wildcard.java",
          code: String.raw`import java.util.ArrayList;
import java.util.List;

public class Wildcard {
    static double sum(List<? extends Number> nums) {
        double total = 0;
        for (Number n : nums) total += n.doubleValue();
        return total;
    }

    static void addAll(List<? super Integer> target) {
        target.add(1);
        target.add(2);
    }

    public static void main(String[] args) {
        System.out.println(sum(List.of(1, 2, 3)));
        System.out.println(sum(List.of(1.5, 2.5)));

        List<Number> numbers = new ArrayList<>();
        addAll(numbers);
        System.out.println(numbers);
    }
}`,
          output: "6.0\n4.0\n[1, 2]",
        },
        {
          type: "table",
          head: ["写法", "能读", "能写", "口诀"],
          rows: [
            ["List<? extends Number>", "✓（读成 Number）", "✗", "Producer Extends：只读"],
            ["List<? super Integer>", "只能读成 Object", "✓", "Consumer Super：只写"],
            ["List<Number>", "✓", "✓", "精确类型"],
          ],
        },
        {
          type: "p",
          html: "PECS = Producer Extends, Consumer Super。方法<strong>生产</strong>数据给调用方（读取）用 <code>extends</code>；方法<strong>消费</strong>调用方传入的数据（写入）用 <code>super</code>。JDK 的 <code>Collections.copy(List&lt;? super T&gt;, List&lt;? extends T&gt;)</code> 就是标准示范。",
        },
        { type: "h", text: "泛型数组与可变参数" },
        {
          type: "code",
          file: "GenericArray.java",
          code: String.raw`import java.util.ArrayList;
import java.util.List;

public class GenericArray {
    @SafeVarargs
    static <T> List<T> of(T... items) {
        List<T> list = new ArrayList<>();
        for (T item : items) list.add(item);
        return list;
    }

    public static void main(String[] args) {
        System.out.println(of("a", "b", "c"));
    }
}`,
          output: "[a, b, c]",
        },
        {
          type: "p",
          html: "可变参数在底层会创建数组，而泛型数组不被允许，所以编译器会给警告。<code>@SafeVarargs</code> 表示你确认方法内部不会把数组暴露出去，可以压制警告。",
        },
      ],
      exercises: [
        {
          id: "a9-1",
          kind: "code",
          title: "泛型 Box",
          difficulty: "★★☆",
          prompt:
            "补全 <code>Box&lt;T&gt;</code>：<code>set</code> 保存值，<code>get</code> 取出值，<code>isPresent</code> 判断是否有值（未设置或设为 null 都算空）。",
          starter: String.raw`class Box<T> {
    private T value;

    void set(T value) {
        // TODO
    }

    T get() {
        // TODO
        return null;
    }

    boolean isPresent() {
        // TODO
        return false;
    }
}

public class Main {
    public static void main(String[] args) {
        Box<String> box = new Box<>();
        box.set("java");
        System.out.println(box.get());
    }
}`,
          hints: [
            "泛型字段就是普通字段，直接赋值/返回即可。",
            "<code>isPresent</code> 返回 <code>value != null</code>。",
          ],
          solution: String.raw`class Box<T> {
    private T value;

    void set(T value) {
        this.value = value;
    }

    T get() {
        return value;
    }

    boolean isPresent() {
        return value != null;
    }
}

public class Main {
    public static void main(String[] args) {
        Box<String> box = new Box<>();
        box.set("java");
        System.out.println(box.get());
    }
}`,
          check: String.raw`        Box<String> text = new Box<>();
        check(!text.isPresent(), "初始状态应为空");
        text.set("java");
        eq(text.get(), "java", "String 类型取值");
        check(text.isPresent(), "设置后 isPresent 应为 true");

        Box<Integer> number = new Box<>();
        number.set(42);
        eq(number.get(), 42, "Integer 类型取值");
        number.set(null);
        check(!number.isPresent(), "设为 null 后应视为空");`,
        },
        {
          id: "a9-2",
          kind: "code",
          title: "泛型最大值",
          difficulty: "★★★",
          prompt:
            "实现 <code>static &lt;T extends Comparable&lt;T&gt;&gt; T max(List&lt;T&gt; list)</code>，返回列表中最大的元素。空列表或 null 抛出 <code>IllegalArgumentException</code>。",
          starter: String.raw`import java.util.List;

public class Main {
    static <T extends Comparable<T>> T max(List<T> list) {
        // TODO
        return null;
    }

    public static void main(String[] args) {
        System.out.println(max(List.of(3, 1, 2)));
        System.out.println(max(List.of("apple", "banana")));
    }
}`,
          hints: [
            "先判空，再取第一个元素作为当前最大值。",
            "遍历时用 <code>current.compareTo(best) &gt; 0</code> 更新。",
          ],
          solution: String.raw`import java.util.List;

public class Main {
    static <T extends Comparable<T>> T max(List<T> list) {
        if (list == null || list.isEmpty()) {
            throw new IllegalArgumentException("列表不能为空");
        }
        T best = list.get(0);
        for (T item : list) {
            if (item.compareTo(best) > 0) best = item;
        }
        return best;
    }

    public static void main(String[] args) {
        System.out.println(max(List.of(3, 1, 2)));
        System.out.println(max(List.of("apple", "banana")));
    }
}`,
          check: String.raw`        eq(Main.max(List.of(3, 1, 2)), 3, "整数最大值");
        eq(Main.max(List.of(-5, -2, -9)), -2, "负数最大值");
        eq(Main.max(List.of("apple", "banana", "cherry")), "cherry", "字符串按字典序");
        boolean thrown = false;
        try { Main.max(List.<Integer>of()); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "空列表应抛出 IllegalArgumentException");`,
        },
        {
          id: "a9-3",
          kind: "code",
          title: "泛型过滤",
          difficulty: "★★★",
          prompt:
            "实现 <code>static &lt;T&gt; List&lt;T&gt; filter(List&lt;T&gt; list, Predicate&lt;T&gt; predicate)</code>，返回满足条件的新列表，保持原顺序，不修改入参。null 列表返回空列表，null 条件抛出 <code>IllegalArgumentException</code>。",
          starter: String.raw`import java.util.*;
import java.util.function.Predicate;

public class Main {
    static <T> List<T> filter(List<T> list, Predicate<T> predicate) {
        // TODO
        return List.of();
    }

    public static void main(String[] args) {
        System.out.println(filter(List.of(1, 2, 3, 4), n -> n % 2 == 0));
    }
}`,
          hints: [
            "新建 <code>ArrayList&lt;T&gt;</code> 存放结果。",
            "遍历时 <code>if (predicate.test(item)) result.add(item);</code>。",
          ],
          solution: String.raw`import java.util.*;
import java.util.function.Predicate;

public class Main {
    static <T> List<T> filter(List<T> list, Predicate<T> predicate) {
        if (predicate == null) throw new IllegalArgumentException("predicate 不能为 null");
        List<T> result = new ArrayList<>();
        if (list == null) return result;
        for (T item : list) {
            if (predicate.test(item)) result.add(item);
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(filter(List.of(1, 2, 3, 4), n -> n % 2 == 0));
    }
}`,
          check: String.raw`        List<Integer> nums = List.of(1, 2, 3, 4, 5, 6);
        eq(Main.filter(nums, n -> n % 2 == 0), List.of(2, 4, 6), "偶数过滤");
        eq(Main.filter(nums, n -> n % 2 != 0), List.of(1, 3, 5), "奇数过滤");
        eq(Main.filter(nums, n -> false), List.of(), "全部不满足");
        eq(Main.filter(null, n -> true), List.of(), "null 列表返回空列表");
        boolean thrown = false;
        try { Main.filter(nums, null); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "predicate 为 null 应抛出异常");`,
        },
        {
          id: "a9-4",
          kind: "quiz",
          question: "为什么 <code>new T[10]</code> 在泛型代码里编译失败？",
          options: [
            "数组长度不能用常量",
            "类型擦除后运行时不知道 T 的实际类型，无法创建对应类型的数组",
            "Java 不允许任何数组",
            "T 必须是基本类型",
          ],
          answer: 1,
          explain:
            "泛型只在编译期存在，运行时类型参数被擦除。创建数组需要运行时类型信息，所以不能直接 <code>new T[]</code>。常见替代是 <code>Object[]</code> + 强转，或让调用方传入 <code>Class&lt;T&gt;</code> / <code>IntFunction&lt;T[]&gt;</code>。",
        },
      ],
      further: [
        "《Effective Java 第 3 版》条目 26：不要使用原始类型；条目 31：利用有限制通配符提升 API 灵活性。",
        "《Java 核心技术 卷 I》第 8 章：泛型程序设计。",
        "GitHub: Snailclimb/JavaGuide 的泛型与类型擦除章节。",
      ],
    },

    /* ============================================================ 10 */
    {
      id: "functional",
      title: "Lambda、Stream 与 Optional",
      summary:
        "函数式风格让“对集合做一系列变换”变得可读，但也很容易写出又长又难调试的流水线。这一节讲清楚惰性求值、Collectors 和 Optional 的正确边界。",
      level: "进阶",
      minutes: 34,
      objectives: [
        "写出合法的 lambda，理解 effectively final 捕获规则",
        "使用四种方法引用简化代码",
        "组合 filter / map / flatMap / sorted / collect 完成数据处理",
        "正确使用 Optional，避免把它当 null 的替代品到处传播",
      ],
      sections: [
        { type: "h", text: "函数式接口：只有一个抽象方法的接口" },
        {
          type: "code",
          file: "FunctionalDemo.java",
          code: String.raw`@FunctionalInterface
interface Formatter {
    String format(String name);
}

public class FunctionalDemo {
    public static void main(String[] args) {
        Formatter upper = name -> name.toUpperCase();
        Formatter decorated = name -> "[" + name + "]";

        System.out.println(upper.format("java"));
        System.out.println(decorated.format("java"));

        // 捕获局部变量：必须是 effectively final
        String prefix = "Hi, ";
        Formatter greeting = name -> prefix + name;
        System.out.println(greeting.format("Lin"));
    }
}`,
          output: "JAVA\n[java]\nHi, Lin",
        },
        {
          type: "list",
          items: [
            "<code>@FunctionalInterface</code> 让编译器检查接口只有一个抽象方法。",
            "lambda 捕获的局部变量不能重新赋值（effectively final），因为闭包捕获的是值的副本。",
            "标准库已有：<code>Function&lt;T,R&gt;</code>、<code>Predicate&lt;T&gt;</code>、<code>Consumer&lt;T&gt;</code>、<code>Supplier&lt;T&gt;</code>、<code>BiFunction</code>。",
          ],
        },
        { type: "h", text: "方法引用：lambda 的简写" },
        {
          type: "table",
          head: ["形式", "等价 lambda", "例子"],
          rows: [
            ["静态方法引用", "args -> Class.staticMethod(args)", "<code>Integer::parseInt</code>"],
            ["实例方法引用", "obj -> obj.method()", "<code>System.out::println</code>"],
            ["任意对象方法引用", "obj -> obj.method(args)", "<code>String::toUpperCase</code>"],
            ["构造器引用", "args -> new Class(args)", "<code>ArrayList::new</code>"],
          ],
        },
        { type: "h", text: "Stream：惰性的管道" },
        {
          type: "code",
          file: "StreamDemo.java",
          code: String.raw`import java.util.List;
import java.util.stream.Collectors;

record Employee(String name, String dept, int salary) {}

public class StreamDemo {
    public static void main(String[] args) {
        List<Employee> list = List.of(
            new Employee("林", "研发", 20_000),
            new Employee("陈", "研发", 25_000),
            new Employee("周", "产品", 18_000)
        );

        List<String> names = list.stream()
            .filter(e -> e.salary() >= 20_000)
            .map(Employee::name)
            .sorted()
            .collect(Collectors.toList());

        System.out.println(names);

        double avg = list.stream()
            .filter(e -> e.dept().equals("研发"))
            .mapToInt(Employee::salary)
            .average()
            .orElse(0);
        System.out.println(avg);
    }
}`,
          output: "[林, 陈]\n22500.0",
        },
        {
          type: "p",
          html: "中间操作（filter / map / sorted / distinct / limit）只是记录步骤，不执行；遇到终端操作（collect / forEach / count / reduce / anyMatch）才真正遍历。这也是 Stream 可以处理无限流、并且短路操作能提前结束的原因。",
        },
        { type: "h", text: "Collectors 常用清单" },
        {
          type: "code",
          file: "CollectDemo.java",
          code: String.raw`import java.util.List;
import java.util.Map;
import java.util.TreeMap;
import java.util.stream.Collectors;

record Player(String team, String name, int score) {}

public class CollectDemo {
    public static void main(String[] args) {
        List<Player> players = List.of(
            new Player("红队", "林", 18),
            new Player("红队", "陈", 25),
            new Player("蓝队", "周", 30)
        );

        Map<String, List<String>> byTeam = players.stream()
            .collect(Collectors.groupingBy(
                Player::team,
                TreeMap::new,
                Collectors.mapping(Player::name, Collectors.toList())));

        Map<String, Double> avgByTeam = players.stream()
            .collect(Collectors.groupingBy(
                Player::team,
                TreeMap::new,
                Collectors.averagingDouble(Player::score)));

        System.out.println(byTeam);
        System.out.println(avgByTeam);
    }
}`,
          output: "{红队=[林, 陈], 蓝队=[周]}\n{红队=21.5, 蓝队=30.0}",
        },
        {
          type: "list",
          items: [
            "<code>toList()</code> 返回不可变列表；需要可变列表用 <code>Collectors.toCollection(ArrayList::new)</code>。",
            "<code>joining(\", \")</code> 拼字符串，<code>partitioningBy</code> 按布尔条件分两组。",
            "<code>toMap</code> 要提供合并函数，否则重复 key 会抛 <code>IllegalStateException</code>。",
            "不要在 Stream 里修改外部集合，这不是它的设计用途。",
          ],
        },
        { type: "h", text: "Optional：表达“可能没有”" },
        {
          type: "code",
          file: "OptionalDemo.java",
          code: String.raw`import java.util.List;
import java.util.Optional;

public class OptionalDemo {
    static Optional<String> findLongest(List<String> words) {
        return words.stream().max((a, b) -> Integer.compare(a.length(), b.length()));
    }

    public static void main(String[] args) {
        System.out.println(findLongest(List.of("java", "stream", "lambda")).orElse("无"));
        System.out.println(findLongest(List.of("a", "bb")).map(String::toUpperCase).orElse("无"));
        System.out.println(findLongest(List.of()).orElse("无"));
    }
}`,
          output: "stream\nBB\n无",
        },
        {
          type: "callout",
          tone: "warn",
          title: "Optional 不是 null 的万能替代",
          html: "不要用 <code>Optional</code> 做字段（不可序列化、增加开销），不要写 <code>optional.get()</code> 而不检查，不要用 <code>orElse(null)</code> 把问题又变回 null。它适合<strong>方法返回值</strong>：明确告诉调用方“可能查不到”。",
        },
        { type: "h", text: "并行流：不是免费的加速" },
        {
          type: "list",
          items: [
            "<code>parallelStream()</code> 使用公共 ForkJoinPool，适合大数组、无状态、CPU 密集计算。",
            "小数据、IO 密集、需要顺序或有共享可变状态时，不要用并行流。",
            "并行流的调试和异常堆栈更难读，线上默认不用，先有基准测试再谈优化。",
          ],
        },
      ],
      exercises: [
        {
          id: "a10-1",
          kind: "code",
          title: "筛选成年人的名字",
          difficulty: "★★☆",
          prompt:
            "给定 <code>record Person(String name, int age)</code>，实现 <code>adultNames(List&lt;Person&gt; people)</code>：筛选年龄大于等于 18 的人，按名字升序返回名字列表。null 或空列表返回空列表。",
          starter: String.raw`import java.util.*;
import java.util.stream.*;

record Person(String name, int age) {}

public class Main {
    static List<String> adultNames(List<Person> people) {
        // TODO: stream + filter + map + sorted
        return List.of();
    }

    public static void main(String[] args) {
        System.out.println(adultNames(List.of(
            new Person("Lin", 22), new Person("Chen", 17), new Person("Zhou", 19))));
    }
}`,
          hints: [
            "判空后 <code>people.stream().filter(p -&gt; p.age() &gt;= 18).map(Person::name).sorted()</code>。",
            "返回 <code>.collect(Collectors.toList())</code> 或 <code>.toList()</code>。",
          ],
          solution: String.raw`import java.util.*;
import java.util.stream.*;

record Person(String name, int age) {}

public class Main {
    static List<String> adultNames(List<Person> people) {
        if (people == null) return List.of();
        return people.stream()
            .filter(p -> p.age() >= 18)
            .map(Person::name)
            .sorted()
            .collect(Collectors.toList());
    }

    public static void main(String[] args) {
        System.out.println(adultNames(List.of(
            new Person("Lin", 22), new Person("Chen", 17), new Person("Zhou", 19))));
    }
}`,
          check: String.raw`        eq(Main.adultNames(List.of(
                new Person("Lin", 22), new Person("Chen", 17), new Person("Zhou", 19))),
           List.of("Lin", "Zhou"), "应只保留成年人并按名字升序");
        eq(Main.adultNames(List.of(new Person("A", 18))), List.of("A"), "18 岁应算成年");
        eq(Main.adultNames(List.of()), List.of(), "空列表返回空");
        eq(Main.adultNames(null), List.of(), "null 返回空");`,
        },
        {
          id: "a10-2",
          kind: "code",
          title: "按部门统计平均分",
          difficulty: "★★★",
          prompt:
            "给定 <code>record Employee(String name, String dept, double score)</code>，实现 <code>avgScoreByDept(List&lt;Employee&gt; employees)</code>，返回部门到平均分的映射。null 或空列表返回空 Map。",
          starter: String.raw`import java.util.*;
import java.util.stream.*;

record Employee(String name, String dept, double score) {}

public class Main {
    static Map<String, Double> avgScoreByDept(List<Employee> employees) {
        // TODO: groupingBy + averagingDouble
        return Map.of();
    }

    public static void main(String[] args) {
        System.out.println(avgScoreByDept(List.of(
            new Employee("Lin", "研发", 88), new Employee("Chen", "研发", 92),
            new Employee("Zhou", "产品", 75))));
    }
}`,
          hints: [
            "<code>Collectors.groupingBy(Employee::dept, Collectors.averagingDouble(Employee::score))</code>。",
            "判空要放在 stream 之前。",
          ],
          solution: String.raw`import java.util.*;
import java.util.stream.*;

record Employee(String name, String dept, double score) {}

public class Main {
    static Map<String, Double> avgScoreByDept(List<Employee> employees) {
        if (employees == null || employees.isEmpty()) return Map.of();
        return employees.stream().collect(
            Collectors.groupingBy(Employee::dept,
                Collectors.averagingDouble(Employee::score)));
    }

    public static void main(String[] args) {
        System.out.println(avgScoreByDept(List.of(
            new Employee("Lin", "研发", 88), new Employee("Chen", "研发", 92),
            new Employee("Zhou", "产品", 75))));
    }
}`,
          check: String.raw`        Map<String, Double> avg = Main.avgScoreByDept(List.of(
            new Employee("Lin", "研发", 88), new Employee("Chen", "研发", 92),
            new Employee("Zhou", "产品", 75)));
        eq(avg.size(), 2, "应有两个部门");
        near(avg.get("研发"), 90.0, 0.0001, "研发部平均分");
        near(avg.get("产品"), 75.0, 0.0001, "产品部平均分");
        check(Main.avgScoreByDept(null).isEmpty(), "null 返回空 Map");
        check(Main.avgScoreByDept(List.of()).isEmpty(), "空列表返回空 Map");`,
        },
        {
          id: "a10-3",
          kind: "code",
          title: "Optional 最长单词",
          difficulty: "★★☆",
          prompt:
            "实现 <code>Optional&lt;String&gt; longestWord(List&lt;String&gt; words)</code>：返回长度最长的单词；长度相同返回先出现的；空列表或 null 返回 <code>Optional.empty()</code>。",
          starter: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    static Optional<String> longestWord(List<String> words) {
        // TODO: stream.max + Optional
        return Optional.empty();
    }

    public static void main(String[] args) {
        System.out.println(longestWord(List.of("java", "stream", "lambda")).orElse("无"));
    }
}`,
          hints: [
            "<code>words.stream().max(Comparator.comparingInt(String::length))</code>。",
            "如果需要“相同长度取先出现”，<code>max</code> 在相等时返回哪一个？用 reduce 显式控制更稳。",
          ],
          solution: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    static Optional<String> longestWord(List<String> words) {
        if (words == null || words.isEmpty()) return Optional.empty();
        return words.stream()
            .reduce((best, current) ->
                current.length() > best.length() ? current : best);
    }

    public static void main(String[] args) {
        System.out.println(longestWord(List.of("java", "stream", "lambda")).orElse("无"));
    }
}`,
          check: String.raw`        eq(Main.longestWord(List.of("java", "stream", "lambda")).orElse(""), "stream", "最长单词应为 stream");
        eq(Main.longestWord(List.of("ab", "cd", "ef")).orElse(""), "ab", "长度相同应返回先出现的");
        check(Main.longestWord(List.of()).isEmpty(), "空列表应返回 Optional.empty");
        check(Main.longestWord(null).isEmpty(), "null 应返回 Optional.empty");`,
        },
        {
          id: "a10-4",
          kind: "quiz",
          question: "下面哪一段 Stream 代码真正触发了遍历？",
          options: [
            "list.stream().filter(x -> x > 0)",
            "list.stream().map(String::trim)",
            "list.stream().sorted()",
            "list.stream().filter(x -> x > 0).count()",
          ],
          answer: 3,
          explain:
            "filter / map / sorted 都是中间操作，只构建管道，不会执行。count() 是终端操作，调用它才会从数据源拉取元素并执行整条管道。",
        },
      ],
      further: [
        "《Java 核心技术 卷 I》第 6 章：Lambda 表达式与函数式接口。",
        "《Effective Java 第 3 版》条目 42–48：Lambda 与 Stream 的最佳实践。",
        "《Java 8 实战》第 4–7 章：Stream 数据处理、并行流与 Collector。",
      ],
    },

    /* ============================================================ 11 */
    {
      id: "io-time",
      title: "字符串、正则、时间与文件 IO",
      summary:
        "日常业务代码里出现频率最高的四类 API：拼字符串、校验格式、算日期、读写文件。这一节用现代 Java 的写法替换掉那些过时的习惯。",
      level: "进阶",
      minutes: 32,
      objectives: [
        "用 StringBuilder 替代循环字符串拼接，理解 String 不可变的代价",
        "用 Pattern / Matcher 完成提取、校验与替换",
        "用 java.time 处理日期、时长与格式化，避免 Calendar / SimpleDateFormat 的坑",
        "用 Files / Path 完成读写，并正确处理编码与异常",
      ],
      sections: [
        { type: "h", text: "StringBuilder：循环拼接的唯一正确姿势" },
        {
          type: "code",
          file: "BuilderDemo.java",
          code: String.raw`public class BuilderDemo {
    public static void main(String[] args) {
        StringBuilder sb = new StringBuilder();
        for (int i = 1; i <= 5; i++) {
            sb.append(i).append(",");
        }
        sb.deleteCharAt(sb.length() - 1);   // 去掉最后一个逗号
        System.out.println(sb);

        String result = sb.toString();
        sb.reverse();
        System.out.println(sb);
        System.out.println(result);
    }
}`,
          output: "1,2,3,4,5\n5,4,3,2,1\n1,2,3,4,5",
        },
        {
          type: "p",
          html: "String 不可变，循环里 <code>s += x</code> 每次都会创建新对象，复杂度 O(n²)。单线程用 <code>StringBuilder</code>；多线程共享用 <code>StringBuffer</code>（有同步开销）。能用 <code>String.join</code> 或 <code>Collectors.joining</code> 时优先用它们。",
        },
        { type: "h", text: "正则：校验与提取" },
        {
          type: "code",
          file: "RegexDemo.java",
          code: String.raw`import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class RegexDemo {
    public static void main(String[] args) {
        String phone = "13812345678";
        System.out.println(phone.matches("1[3-9]\\d{9}"));

        String text = "订单 A1001 金额 88 元，订单 B2002 金额 120 元";
        Pattern p = Pattern.compile("订单 (\\w+) 金额 (\\d+) 元");
        Matcher m = p.matcher(text);
        while (m.find()) {
            System.out.println(m.group(1) + " -> " + m.group(2));
        }

        System.out.println(phone.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2"));
    }
}`,
          output: "true\nA1001 -> 88\nB2002 -> 120\n138****5678",
        },
        {
          type: "callout",
          tone: "tip",
          title: "Pattern 要复用",
          html: "在循环里反复调用 <code>String.matches</code> 会每次编译正则。高频校验/提取时，把 <code>Pattern</code> 提取成 <code>static final</code> 常量，再用 <code>matcher</code>。",
        },
        { type: "h", text: "java.time：不可变、线程安全" },
        {
          type: "code",
          file: "TimeDemo.java",
          code: String.raw`import java.time.*;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;

public class TimeDemo {
    public static void main(String[] args) {
        LocalDate date = LocalDate.of(2026, 11, 3);
        LocalDate next = date.plusDays(30);
        System.out.println(next);
        System.out.println(next.getDayOfWeek());

        System.out.println(ChronoUnit.DAYS.between(date, next));

        LocalDateTime meeting = LocalDateTime.of(2026, 11, 3, 14, 30);
        DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
        System.out.println(meeting.format(fmt));

        Duration d = Duration.ofMinutes(95);
        System.out.println(d.toHours() + "h " + (d.toMinutes() % 60) + "m");
    }
}`,
          output: "2026-12-03\nTHURSDAY\n30\n2026-11-03 14:30\n1h 35m",
        },
        {
          type: "table",
          head: ["旧 API", "新 API", "说明"],
          rows: [
            ["Date / Calendar", "Instant / LocalDate / LocalDateTime / ZonedDateTime", "不可变、线程安全"],
            ["SimpleDateFormat", "DateTimeFormatter", "可共享，线程安全"],
            ["System.currentTimeMillis", "Instant.now / Clock", "可注入 Clock 方便测试"],
          ],
        },
        {
          type: "p",
          html: "时区必须显式：跨时区业务用 <code>ZonedDateTime</code>；只表示“日期”用 <code>LocalDate</code>；表示“时间点”用 <code>Instant</code>。不要用 <code>LocalDateTime</code> 存跨时区的绝对时间。",
        },
        { type: "h", text: "文件读写：Files + Path" },
        {
          type: "code",
          file: "FileDemo.java",
          code: String.raw`import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.List;

public class FileDemo {
    public static void main(String[] args) throws IOException {
        Path path = Path.of("demo.txt");
        Files.writeString(path, "第一行\n第二行\n第三行\n");

        List<String> lines = Files.readAllLines(path);
        System.out.println(lines.size());
        System.out.println(lines.get(1));

        Files.lines(path)
             .filter(line -> line.contains("二"))
             .forEach(System.out::println);

        Files.deleteIfExists(path);
    }
}`,
          output: "3\n第二行\n第二行",
        },
        {
          type: "list",
          items: [
            "读小文件用 <code>Files.readAllLines</code> / <code>readString</code>；大文件用 <code>Files.lines</code> 流式处理。",
            "写文件用 <code>Files.writeString</code>（覆盖）或 <code>Files.write</code>（追加时传 <code>StandardOpenOption.APPEND</code>）。",
            "所有方法默认使用 UTF-8；需要其他编码时显式传 <code>Charset</code>。",
            "路径拼接用 <code>Path.resolve</code>，不要手工拼字符串分隔符。",
          ],
        },
        { type: "h", text: "IO 流：字节流 vs 字符流" },
        {
          type: "table",
          head: ["类型", "基类", "处理对象", "典型包装"],
          rows: [
            ["字节流", "InputStream / OutputStream", "二进制、图片、网络", "BufferedInputStream"],
            ["字符流", "Reader / Writer", "文本", "BufferedReader / InputStreamReader"],
            ["NIO", "Channel / Buffer", "高性能 IO", "FileChannel、ByteBuffer"],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "编码不一致会出现乱码",
          html: "用 <code>InputStreamReader</code> 读文本时必须指定 <code>StandardCharsets.UTF_8</code>，否则在不同平台默认编码不同。Windows 上尤其容易踩坑。",
        },
      ],
      exercises: [
        {
          id: "a11-1",
          kind: "code",
          title: "手机号脱敏",
          difficulty: "★★☆",
          prompt:
            "实现 <code>maskPhone(String phone)</code>：11 位手机号保留前 3 位和后 4 位，中间 4 位替换成 <code>*</code>。不是 11 位数字（包括 null）原样返回。",
          starter: String.raw`public class Main {
    static String maskPhone(String phone) {
        // TODO
        return phone;
    }

    public static void main(String[] args) {
        System.out.println(maskPhone("13812345678"));
    }
}`,
          hints: [
            "先判断 <code>phone != null &amp;&amp; phone.matches(\"\\\\d{11}\")</code>。",
            "<code>replaceAll(\"(\\\\d{3})\\\\d{4}(\\\\d{4})\", \"$1****$2\")</code>。",
          ],
          solution: String.raw`public class Main {
    static String maskPhone(String phone) {
        if (phone == null || !phone.matches("\\d{11}")) return phone;
        return phone.replaceAll("(\\d{3})\\d{4}(\\d{4})", "$1****$2");
    }

    public static void main(String[] args) {
        System.out.println(maskPhone("13812345678"));
    }
}`,
          check: String.raw`        eq(Main.maskPhone("13812345678"), "138****5678", "11 位手机号脱敏");
        eq(Main.maskPhone("1381234567"), "1381234567", "10 位原样返回");
        eq(Main.maskPhone("138123456789"), "138123456789", "12 位原样返回");
        eq(Main.maskPhone("1381234567a"), "1381234567a", "包含非数字应原样返回");
        eq(Main.maskPhone(null), null, "null 原样返回");`,
        },
        {
          id: "a11-2",
          kind: "code",
          title: "计算两个日期之间的天数",
          difficulty: "★★☆",
          prompt:
            "实现 <code>daysBetween(String start, String end)</code>，两个参数都是 <code>yyyy-MM-dd</code> 格式。返回 end 减 start 的天数；end 早于 start 时返回负数。格式非法抛出 <code>IllegalArgumentException</code>。",
          starter: String.raw`import java.time.*;
import java.time.temporal.ChronoUnit;

public class Main {
    static long daysBetween(String start, String end) {
        // TODO: LocalDate.parse + ChronoUnit.DAYS.between
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(daysBetween("2026-03-01", "2026-11-03"));
    }
}`,
          hints: [
            "<code>ChronoUnit.DAYS.between(LocalDate.parse(start), LocalDate.parse(end))</code>。",
            "格式错误会抛 <code>DateTimeParseException</code>（RuntimeException），捕获后换成 IllegalArgumentException。",
          ],
          solution: String.raw`import java.time.*;
import java.time.format.DateTimeParseException;
import java.time.temporal.ChronoUnit;

public class Main {
    static long daysBetween(String start, String end) {
        try {
            LocalDate s = LocalDate.parse(start);
            LocalDate e = LocalDate.parse(end);
            return ChronoUnit.DAYS.between(s, e);
        } catch (DateTimeParseException e) {
            throw new IllegalArgumentException("日期格式必须是 yyyy-MM-dd", e);
        }
    }

    public static void main(String[] args) {
        System.out.println(daysBetween("2026-03-01", "2026-11-03"));
    }
}`,
          check: String.raw`        eq(Main.daysBetween("2026-03-01", "2026-11-03"), 247L, "2026-03-01 到 2026-11-03 应为 247 天");
        eq(Main.daysBetween("2026-11-03", "2026-03-01"), -247L, "反向应为负数");
        eq(Main.daysBetween("2026-01-01", "2026-01-01"), 0L, "同一天为 0");
        boolean thrown = false;
        try { Main.daysBetween("2026/03/01", "2026-11-03"); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "非法格式应抛出 IllegalArgumentException");`,
        },
        {
          id: "a11-3",
          kind: "code",
          title: "统计文件行数",
          difficulty: "★★★",
          prompt:
            "实现 <code>long countLines(Path path) throws IOException</code>，返回文件行数（最后一行没有换行也算一行）。使用 <code>Files</code> 提供的 API，文件为空返回 0。",
          starter: String.raw`import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    static long countLines(Path path) throws IOException {
        // TODO: Files.lines 或 readAllLines
        return 0;
    }

    public static void main(String[] args) throws IOException {
        Path p = Files.createTempFile("demo", ".txt");
        Files.writeString(p, "a\nb\nc\n");
        System.out.println(countLines(p));
        Files.deleteIfExists(p);
    }
}`,
          hints: [
            "<code>Files.lines(path).count()</code> 返回 long，且会关闭文件。",
            "如果用 <code>readAllLines</code>，返回的是 <code>List.size()</code>。",
          ],
          solution: String.raw`import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

public class Main {
    static long countLines(Path path) throws IOException {
        try (var lines = Files.lines(path)) {
            return lines.count();
        }
    }

    public static void main(String[] args) throws IOException {
        Path p = Files.createTempFile("demo", ".txt");
        Files.writeString(p, "a\nb\nc\n");
        System.out.println(countLines(p));
        Files.deleteIfExists(p);
    }
}`,
          check: String.raw`        Path p = Files.createTempFile("javaforge", ".txt");
        try {
            Files.writeString(p, "a\nb\nc\n");
            eq(Main.countLines(p), 3L, "三行文本");
            Files.writeString(p, "");
            eq(Main.countLines(p), 0L, "空文件应为 0 行");
            Files.writeString(p, "a\nb");
            eq(Main.countLines(p), 2L, "最后一行没有换行也算一行");
        } finally {
            Files.deleteIfExists(p);
        }`,
        },
        {
          id: "a11-4",
          kind: "quiz",
          question: "为什么现代 Java 用 <code>DateTimeFormatter</code> 替代 <code>SimpleDateFormat</code>？",
          options: [
            "SimpleDateFormat 不支持时分秒",
            "SimpleDateFormat 是线程不安全的，共享实例会解析出错",
            "DateTimeFormatter 只能用于 LocalDate",
            "SimpleDateFormat 已经被删除",
          ],
          answer: 1,
          explain:
            "<code>SimpleDateFormat</code> 内部持有可变状态，多线程共享会得到错误结果或异常。它早在 Java 8 就被 <code>java.time</code> 取代。新代码不要再用 Date / Calendar / SimpleDateFormat。",
        },
      ],
      further: [
        "《Java 核心技术 卷 I》第 3 章：字符串与正则；第 13 章：集合与 IO。",
        "《Java 核心技术 卷 II》第 1 章：流与文件；第 6 章：日期与时间 API。",
        "《Effective Java 第 3 版》条目 63：注意字符串拼接的性能。",
      ],
    },

    /* ============================================================ 12 */
    {
      id: "concurrency",
      title: "线程、锁与并发工具",
      summary:
        "并发不是“开个线程就快了”。共享可变状态、可见性、原子性、任务编排，每一个都可能让程序在压测时才出错。这一节用可验证的计数器、并行求和和 Future 编排建立直觉。",
      level: "进阶",
      minutes: 38,
      objectives: [
        "创建线程、理解线程生命周期与 Runnable",
        "解释原子性、可见性、有序性，用 synchronized / volatile / Atomic 解决竞争",
        "使用 ExecutorService 管理线程池并按正确方式关闭",
        "用 CompletableFuture 编排异步任务并处理结果",
      ],
      sections: [
        { type: "h", text: "创建线程的三种方式" },
        {
          type: "code",
          file: "ThreadDemo.java",
          code: String.raw`public class ThreadDemo {
    public static void main(String[] args) throws InterruptedException {
        Thread t1 = new Thread(() -> System.out.println("任务 A"));
        Thread t2 = new Thread(new Runnable() {
            @Override
            public void run() {
                System.out.println("任务 B");
            }
        });

        t1.start();
        t2.start();
        t1.join();   // 等 t1 结束
        t2.join();
        System.out.println("主线程继续");
    }
}`,
          output: "任务 B\n任务 A\n主线程继续（线程输出顺序不保证）",
        },
        {
          type: "list",
          items: [
            "继承 Thread 会占用唯一的继承位，实际项目优先实现 Runnable / Callable。",
            "<code>start()</code> 才是启动新线程；直接调用 <code>run()</code> 只是普通方法调用。",
            "<code>join()</code> 等待线程结束；<code>interrupt()</code> 发出中断信号，是否响应由任务自己决定。",
          ],
        },
        { type: "h", text: "三个关键词：原子性、可见性、有序性" },
        {
          type: "code",
          file: "RaceDemo.java",
          code: String.raw`public class RaceDemo {
    static int count = 0;

    public static void main(String[] args) throws Exception {
        Thread[] threads = new Thread[4];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 10000; j++) {
                    count++;          // 读-改-写三步，不是原子操作
                }
            });
            threads[i].start();
        }
        for (Thread t : threads) t.join();
        System.out.println(count);    // 往往小于 40000
    }
}`,
          output: "可能输出 2xxxx / 3xxxx，几乎不会正好 40000",
        },
        {
          type: "table",
          head: ["问题", "含义", "解决手段"],
          rows: [
            ["原子性", "一个操作不可分割", "synchronized、AtomicInteger、Lock"],
            ["可见性", "一个线程的修改另一个线程何时能看到", "volatile、synchronized、final"],
            ["有序性", "编译器/CPU 可能重排指令", "happens-before 规则、volatile、锁"],
          ],
        },
        {
          type: "code",
          file: "SafeCount.java",
          code: String.raw`import java.util.concurrent.atomic.AtomicInteger;

public class SafeCount {
    private final AtomicInteger count = new AtomicInteger();

    public void increment() {
        count.incrementAndGet();      // CAS，无锁但保证原子性
    }

    public int get() {
        return count.get();
    }

    public static void main(String[] args) throws Exception {
        SafeCount c = new SafeCount();
        Thread[] threads = new Thread[4];
        for (int i = 0; i < 4; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 10000; j++) c.increment();
            });
            threads[i].start();
        }
        for (Thread t : threads) t.join();
        System.out.println(c.get());   // 40000
    }
}`,
          output: "40000",
        },
        {
          type: "callout",
          tone: "deep",
          title: "volatile 只保证可见性，不保证原子性",
          html: "<code>volatile int count</code> 再执行 <code>count++</code> 仍然会丢更新，因为自增是读-改-写三步。计数用 <code>AtomicInteger</code> / <code>LongAdder</code>；复合操作要加锁。",
        },
        { type: "h", text: "线程池：别每次 new Thread" },
        {
          type: "code",
          file: "PoolDemo.java",
          code: String.raw`import java.util.concurrent.*;

public class PoolDemo {
    public static void main(String[] args) throws Exception {
        ExecutorService pool = Executors.newFixedThreadPool(3);
        try {
            Future<Integer> future = pool.submit(() -> {
                Thread.sleep(100);
                return 42;
            });
            System.out.println(future.get());   // 阻塞直到结果返回
        } finally {
            pool.shutdown();                    // 不再接收新任务
            if (!pool.awaitTermination(5, TimeUnit.SECONDS)) {
                pool.shutdownNow();             // 强制取消
            }
        }
    }
}`,
          output: "42",
        },
        {
          type: "table",
          head: ["参数", "含义", "设错会怎样"],
          rows: [
            ["corePoolSize", "常驻核心线程数", "太小任务排队，太大浪费内存"],
            ["maximumPoolSize", "最大线程数", "无界队列时永远不会超过 core"],
            ["keepAliveTime", "非核心线程空闲存活时间", "线程频繁创建销毁"],
            ["workQueue", "任务队列", "无界队列会掩盖过载，直到 OOM"],
            ["handler", "拒绝策略", "默认抛异常，可改为调用方执行 / 丢弃"],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "不要用 Executors 默认工厂应付生产",
          html: "<code>Executors.newFixedThreadPool</code> 用无界队列，任务堆积可能 OOM；<code>newCachedThreadPool</code> 最大线程数是 <code>Integer.MAX_VALUE</code>，高并发会创建过多线程。生产环境用 <code>new ThreadPoolExecutor(...)</code> 显式指定有界队列和拒绝策略。",
        },
        { type: "h", text: "CompletableFuture：编排异步任务" },
        {
          type: "code",
          file: "AsyncDemo.java",
          code: String.raw`import java.util.concurrent.*;

public class AsyncDemo {
    static String fetch(String name, long delay) {
        try { Thread.sleep(delay); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        return name + "=" + delay;
    }

    public static void main(String[] args) throws Exception {
        try (ExecutorService pool = Executors.newFixedThreadPool(3)) {
            CompletableFuture<String> a = CompletableFuture.supplyAsync(() -> fetch("A", 200), pool);
            CompletableFuture<String> b = CompletableFuture.supplyAsync(() -> fetch("B", 100), pool);

            CompletableFuture<String> combined = a.thenCombine(b, (x, y) -> x + " & " + y);
            System.out.println(combined.join());
        }
    }
}`,
          output: "A=200 & B=100",
        },
        {
          type: "list",
          items: [
            "<code>supplyAsync</code> 有返回值，<code>runAsync</code> 无返回值。",
            "<code>thenApply</code> 转换结果，<code>thenCompose</code> 串联另一个异步任务，<code>thenCombine</code> 合并两个结果。",
            "<code>exceptionally</code> / <code>handle</code> 处理异常，否则异常会包在 <code>CompletionException</code> 里。",
            "永远给异步任务传自定义线程池，默认的 ForkJoinPool.commonPool 会被全应用共享。",
          ],
        },
        { type: "h", text: "并发集合与死锁" },
        {
          type: "list",
          items: [
            "<code>ConcurrentHashMap</code> 替代 <code>Collections.synchronizedMap</code>，读多写少场景性能更好。",
            "<code>CopyOnWriteArrayList</code> 适合读多写极少的监听器列表，写时复制整个数组。",
            "<code>BlockingQueue</code> 是生产者-消费者标准解法，比手写 wait/notify 安全。",
            "死锁四条件：互斥、占有且等待、不可抢占、循环等待。工程上最常见的解法是<strong>统一加锁顺序</strong>。",
            "Java 21 的虚拟线程适合高并发 IO 阻塞场景，但不改变共享状态的竞争问题。",
          ],
        },
      ],
      exercises: [
        {
          id: "a12-1",
          kind: "code",
          title: "线程安全计数器",
          difficulty: "★★★",
          prompt:
            "补全 <code>Counter</code> 的 <code>increment()</code>，使它在多线程并发调用时不丢更新。判题会启动 8 个线程、每个线程自增 2000 次，最后校验总数是 16000。",
          starter: String.raw`class Counter {
    private int count;

    void increment() {
        count++;          // TODO: 这里不是原子操作
    }

    int get() {
        return count;
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        Counter c = new Counter();
        Thread[] threads = new Thread[8];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 2000; j++) c.increment();
            });
            threads[i].start();
        }
        for (Thread t : threads) t.join();
        System.out.println(c.get());
    }
}`,
          hints: [
            "把字段改成 <code>AtomicInteger</code>，<code>incrementAndGet()</code>。",
            "或者给 <code>increment()</code> 加 <code>synchronized</code>，get 也要保证可见性。",
          ],
          solution: String.raw`import java.util.concurrent.atomic.AtomicInteger;

class Counter {
    private final AtomicInteger count = new AtomicInteger();

    void increment() {
        count.incrementAndGet();
    }

    int get() {
        return count.get();
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        Counter c = new Counter();
        Thread[] threads = new Thread[8];
        for (int i = 0; i < threads.length; i++) {
            threads[i] = new Thread(() -> {
                for (int j = 0; j < 2000; j++) c.increment();
            });
            threads[i].start();
        }
        for (Thread t : threads) t.join();
        System.out.println(c.get());
    }
}`,
          check: String.raw`        Counter c = new Counter();
        int threads = 8, perThread = 2000;
        java.util.concurrent.CountDownLatch start = new java.util.concurrent.CountDownLatch(1);
        Thread[] ts = new Thread[threads];
        for (int i = 0; i < threads; i++) {
            ts[i] = new Thread(() -> {
                try { start.await(); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
                for (int j = 0; j < perThread; j++) c.increment();
            });
            ts[i].start();
        }
        start.countDown();
        for (Thread t : ts) t.join();
        eq(c.get(), threads * perThread, "并发自增后总数应为 16000，说明存在丢失更新");`,
        },
        {
          id: "a12-2",
          kind: "code",
          title: "分片并行求和",
          difficulty: "★★★",
          prompt:
            "实现 <code>parallelSum(int[] arr, int threads)</code>：把数组切成最多 <code>threads</code> 段，用 <code>ExecutorService</code> 并行求和并汇总。要求最后关闭线程池；null 数组返回 0；threads 小于 1 时按 1 处理。",
          starter: String.raw`import java.util.concurrent.*;

public class Main {
    static long parallelSum(int[] arr, int threads) {
        // TODO
        return 0;
    }

    public static void main(String[] args) throws Exception {
        System.out.println(parallelSum(new int[]{1, 2, 3, 4}, 2));
    }
}`,
          hints: [
            "段大小：<code>(arr.length + n - 1) / n</code>。",
            "每段提交一个 <code>Callable&lt;Long&gt;</code>，用 <code>Future.get()</code> 汇总。",
            "finally 里 <code>pool.shutdown()</code>。",
          ],
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    static long parallelSum(int[] arr, int threads) {
        if (arr == null || arr.length == 0) return 0;
        int n = Math.max(1, threads);
        ExecutorService pool = Executors.newFixedThreadPool(Math.min(n, arr.length));
        try {
            int chunk = (arr.length + n - 1) / n;
            List<Future<Long>> futures = new ArrayList<>();
            for (int start = 0; start < arr.length; start += chunk) {
                int from = start;
                int to = Math.min(arr.length, start + chunk);
                futures.add(pool.submit(() -> {
                    long sum = 0;
                    for (int i = from; i < to; i++) sum += arr[i];
                    return sum;
                }));
            }
            long total = 0;
            for (Future<Long> f : futures) total += f.get();
            return total;
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
            throw new RuntimeException(e);
        } catch (ExecutionException e) {
            throw new RuntimeException(e.getCause());
        } finally {
            pool.shutdown();
        }
    }

    public static void main(String[] args) throws Exception {
        System.out.println(parallelSum(new int[]{1, 2, 3, 4}, 2));
    }
}`,
          check: String.raw`        int[] data = new int[1000];
        for (int i = 0; i < data.length; i++) data[i] = i;
        eq(Main.parallelSum(data, 4), 499500L, "0..999 的和");
        eq(Main.parallelSum(new int[]{1, 2, 3}, 1), 6L, "单线程也要正确");
        eq(Main.parallelSum(new int[]{5}, 8), 5L, "线程数超过元素个数");
        eq(Main.parallelSum(null, 3), 0L, "null 返回 0");
        eq(Main.parallelSum(new int[0], 2), 0L, "空数组返回 0");`,
        },
        {
          id: "a12-3",
          kind: "code",
          title: "等待全部 Future",
          difficulty: "★★★",
          prompt:
            "实现 <code>static &lt;T&gt; List&lt;T&gt; awaitAll(List&lt;CompletableFuture&lt;T&gt;&gt; futures)</code>：等所有任务完成后，按原顺序返回结果。null 或空列表返回空列表。",
          starter: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    static <T> List<T> awaitAll(List<CompletableFuture<T>> futures) {
        // TODO: allOf + join
        return List.of();
    }

    public static void main(String[] args) throws Exception {
        List<CompletableFuture<Integer>> fs = List.of(
            CompletableFuture.supplyAsync(() -> 1),
            CompletableFuture.supplyAsync(() -> 2));
        System.out.println(awaitAll(fs));
    }
}`,
          hints: [
            "<code>CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join()</code>。",
            "完成后按原列表顺序逐个 <code>join()</code> 取结果。",
          ],
          solution: String.raw`import java.util.*;
import java.util.concurrent.*;

public class Main {
    static <T> List<T> awaitAll(List<CompletableFuture<T>> futures) {
        if (futures == null || futures.isEmpty()) return List.of();
        CompletableFuture.allOf(futures.toArray(new CompletableFuture[0])).join();
        List<T> result = new ArrayList<>();
        for (CompletableFuture<T> f : futures) result.add(f.join());
        return result;
    }

    public static void main(String[] args) throws Exception {
        List<CompletableFuture<Integer>> fs = List.of(
            CompletableFuture.supplyAsync(() -> 1),
            CompletableFuture.supplyAsync(() -> 2));
        System.out.println(awaitAll(fs));
    }
}`,
          check: String.raw`        List<CompletableFuture<String>> fs = List.of(
            CompletableFuture.completedFuture("a"),
            CompletableFuture.supplyAsync(() -> "b"),
            CompletableFuture.completedFuture("c"));
        eq(Main.awaitAll(fs), List.of("a", "b", "c"), "结果应按原顺序返回");
        eq(Main.awaitAll(List.of()), List.of(), "空列表返回空");
        eq(Main.awaitAll(null), List.of(), "null 返回空列表");`,
        },
        {
          id: "a12-4",
          kind: "quiz",
          question: "把 <code>int count</code> 改成 <code>volatile int count</code> 后，多线程执行 <code>count++</code> 是否安全？",
          options: [
            "安全，volatile 保证所有操作原子性",
            "不安全，volatile 只保证可见性和禁止重排，count++ 仍是读-改-写三步",
            "安全，因为 volatile 会加锁",
            "不安全，volatile 只对 long 有效",
          ],
          answer: 1,
          explain:
            "<code>volatile</code> 保证一个线程的写入对另一个线程可见，并禁止相关重排，但不提供复合操作的原子性。<code>count++</code> 需要读、加、写三步，仍会丢更新。计数应使用 <code>AtomicInteger</code> / <code>LongAdder</code>，或用锁保护。",
        },
      ],
      further: [
        "《Java 并发编程实战》第 2–6 章：线程安全、共享对象、组合对象、基础构建模块。",
        "《深入理解 Java 虚拟机》第 12–13 章：Java 内存模型与线程安全。",
        "《Java 并发编程的艺术》第 3–5 章：内存模型、锁与并发容器。",
        "GitHub: Snailclimb/JavaGuide 的并发编程章节（线程池参数、AQS、CAS）。",
      ],
    },
  ],
});
