/* 模块 01 · 基础重塑
   写给“学过 Java、但现在只记得 public static void main”的人。
   先把编译模型、类型系统、流程控制和方法/数组这四块地基重新夯实。 */
window.CURRICULUM = window.CURRICULUM || { modules: [] };
window.CURRICULUM.modules.push({
  id: "foundations",
  index: "01",
  title: "基础重塑",
  tagline: "先把地基重新夯一遍",
  description:
    "不从头背语法，而是把最容易忘、最容易在面试里露怯的四块补回来：JDK 与编译模型、基本类型与包装类、流程控制、方法与数组。每节都有能直接编译运行的练习。",
  accent: "#2f6488",
  lessons: [
    /* ============================================================ 01 */
    {
      id: "hello-java",
      title: "从 javac 到 main：Java 程序的骨架",
      summary:
        "Java 不是“写完就能跑”的脚本语言。源码、字节码、JVM 三者之间的关系，决定了你以后遇到 ClassNotFound、NoSuchMethod 时能不能一眼看出问题。",
      level: "基础重塑",
      minutes: 20,
      objectives: [
        "说清 JDK、JRE、JVM 各自负责什么",
        "用 javac / java 两条命令完成编译与运行",
        "写出符合规范的 main 方法，并理解类名与文件名的约束",
        "用 println / printf 控制输出格式",
      ],
      sections: [
        { type: "h", text: "JDK、JRE、JVM：别再混着叫" },
        {
          type: "p",
          html: "很多人把三个词当同义词。实际关系是包含：<strong>JDK ⊃ JRE ⊃ JVM</strong>。JVM 负责执行字节码；JRE 是 JVM 加核心类库；JDK 在 JRE 之上再加编译器和调试工具。你写代码需要的是 JDK，只运行别人的程序需要 JRE。",
        },
        {
          type: "table",
          head: ["组件", "里面有什么", "你什么时候用到"],
          rows: [
            ["JVM", "字节码执行引擎、内存管理、GC", "程序运行，跨平台就靠它"],
            ["JRE", "JVM + java.* 核心类库", "只运行已编译的 .class / .jar"],
            ["JDK", "JRE + javac、javadoc、jdb、jconsole", "开发、编译、调试、排查问题"],
          ],
        },
        {
          type: "callout",
          tone: "tip",
          title: "“一次编写，到处运行”到底指什么",
          html: "源码先被 <code>javac</code> 编译成与平台无关的字节码（.class），再由各平台的 JVM 翻译成本机指令。跨平台的是字节码，不是源码，也不是 JVM 本身。",
        },
        { type: "h", text: "最小可运行程序" },
        {
          type: "code",
          file: "Hello.java",
          code: String.raw`public class Hello {
    public static void main(String[] args) {
        System.out.println("Hello, Java!");
    }
}`,
          output: "Hello, Java!",
        },
        {
          type: "p",
          html: "拆开看：<code>public class Hello</code> 定义了一个类；<code>main</code> 是 JVM 约定的入口方法，签名必须接近 <code>public static void main(String[] args)</code>；<code>System.out</code> 是标准输出流。JVM 启动时只认这个签名，写错不会报错，只会提示“找不到主方法”。",
        },
        { type: "h", text: "编译与运行是两步" },
        {
          type: "code",
          file: "terminal",
          lang: "shell",
          plain: true,
          code: `javac Hello.java     # 生成 Hello.class（字节码）
java Hello           # 启动 JVM，加载 Hello 类，执行 main

# 注意：java 后面接类名，不接 Hello.class，也不接路径`,
          output: "Hello, Java!",
        },
        {
          type: "callout",
          tone: "warn",
          title: "类名 = 文件名（public 类）",
          html: "一个文件里最多只能有一个 <code>public</code> 类，而且文件名必须与它完全一致，大小写也算。把 <code>Hello.java</code> 改成 <code>hello.java</code> 会直接编译失败。非 public 类可以随意命名，但一个文件里通常只放一个主类。",
        },
        { type: "h", text: "输出：println、print、printf" },
        {
          type: "code",
          file: "Format.java",
          code: String.raw`public class Format {
    public static void main(String[] args) {
        String name = "Lin";
        int minutes = 25;
        double rate = 0.875;

        System.out.println(name + " 今天练习 " + minutes + " 分钟");
        System.out.printf("%-6s|%4d|%6.1f%%%n", name, minutes, rate * 100);
    }
}`,
          output: "Lin 今天练习 25 分钟\nLin   |  25|  87.5%",
        },
        {
          type: "table",
          head: ["占位符", "含义", "例子"],
          rows: [
            ["%s", "字符串", "<code>%s</code>"],
            ["%d", "整数", "<code>%4d</code> 右对齐宽度 4"],
            ["%f", "浮点数", "<code>%.2f</code> 保留两位"],
            ["%-6s", "左对齐宽度 6", "常用于表格"],
            ["%n", "换行（平台无关）", "比 <code>\\n</code> 更稳妥"],
          ],
        },
        { type: "h", text: "命名与格式：让代码像 Java" },
        {
          type: "list",
          items: [
            "类名用 <code>UpperCamelCase</code>：<code>OrderService</code>、<code>UserRepository</code>。",
            "方法和变量用 <code>lowerCamelCase</code>：<code>calculateTotal</code>、<code>orderCount</code>。",
            "常量全大写加下划线：<code>MAX_RETRY_COUNT</code>。",
            "左大括号不换行，4 个空格缩进；不要用 Tab 混排。",
            "包名全小写，按公司域名倒写：<code>com.example.order</code>。",
          ],
        },
        { type: "h", text: "新手最常见的四个编译错误" },
        {
          type: "table",
          head: ["报错关键词", "真实原因", "怎么修"],
          rows: [
            ["';' expected", "上一行少了分号，或用了中文分号", "切到英文输入法"],
            ["class X is public, should be declared in a file named X.java", "文件名和 public 类名不一致", "改文件名或改类名"],
            ["cannot find symbol", "变量没声明、拼写错、没 import", "看报错行号，向上找声明"],
            ["incompatible types", "类型不匹配，比如 int 赋给 String", "显式转换或换类型"],
          ],
        },
      ],
      exercises: [
        {
          id: "f1-1",
          kind: "code",
          title: "返回一句问候",
          difficulty: "★☆☆",
          prompt:
            "补全 <code>greeting()</code>，让它返回字符串 <code>你好，Java</code>。运行 <code>main</code> 时会打印结果；判题会直接调用这个方法。",
          starter: String.raw`public class Main {
    static String greeting() {
        // TODO: 返回 "你好，Java"
        return "";
    }

    public static void main(String[] args) {
        System.out.println(greeting());
    }
}`,
          hints: [
            "Java 字符串用双引号，返回值类型已经是 <code>String</code>。",
            "不要写 <code>System.out.println</code> 到方法里，题目要求“返回”。",
          ],
          solution: String.raw`public class Main {
    static String greeting() {
        return "你好，Java";
    }

    public static void main(String[] args) {
        System.out.println(greeting());
    }
}`,
          check: String.raw`        eq(Main.greeting(), "你好，Java", "greeting() 的返回值不对");
        eq(Main.greeting().length(), 7, "标点与空格都要一致：你好，Java");`,
        },
        {
          id: "f1-2",
          kind: "code",
          title: "格式化学习计划",
          difficulty: "★☆☆",
          prompt:
            "实现 <code>plan(String name, int minutes)</code>，返回形如 <code>Lin：今天练习 25 分钟</code> 的字符串。要求使用 <code>String.format</code>，而不是手工拼接。",
          starter: String.raw`public class Main {
    static String plan(String name, int minutes) {
        // TODO: 使用 String.format
        return "";
    }

    public static void main(String[] args) {
        System.out.println(plan("Lin", 25));
    }
}`,
          hints: [
            "格式串：<code>\"%s：今天练习 %d 分钟\"</code>。",
            "冒号是中文全角“：”，不要写成英文冒号。",
          ],
          solution: String.raw`public class Main {
    static String plan(String name, int minutes) {
        return String.format("%s：今天练习 %d 分钟", name, minutes);
    }

    public static void main(String[] args) {
        System.out.println(plan("Lin", 25));
    }
}`,
          check: String.raw`        eq(Main.plan("Lin", 25), "Lin：今天练习 25 分钟", "plan(\"Lin\", 25) 结果不对");
        eq(Main.plan("Chen", 40), "Chen：今天练习 40 分钟", "plan(\"Chen\", 40) 结果不对");`,
        },
        {
          id: "f1-3",
          kind: "code",
          title: "用 printf 对齐表格",
          difficulty: "★★☆",
          prompt:
            "实现 <code>tableRow(String name, int score)</code>，返回 <code>%-6s|%4d</code> 格式的一行。例如 <code>tableRow(\"Lin\", 88)</code> 应返回 <code>Lin   |  88</code>（<code>Lin</code> 后 3 个空格，竖线后 2 个空格）。",
          starter: String.raw`public class Main {
    static String tableRow(String name, int score) {
        // TODO: 用 String.format("%-6s|%4d", ...)
        return "";
    }

    public static void main(String[] args) {
        System.out.println(tableRow("Lin", 88));
        System.out.println(tableRow("Chen", 95));
    }
}`,
          hints: [
            "<code>%-6s</code> 表示左对齐、总宽 6；<code>%4d</code> 表示右对齐、总宽 4。",
            "返回的是整行字符串，不要额外加换行。",
          ],
          solution: String.raw`public class Main {
    static String tableRow(String name, int score) {
        return String.format("%-6s|%4d", name, score);
    }

    public static void main(String[] args) {
        System.out.println(tableRow("Lin", 88));
        System.out.println(tableRow("Chen", 95));
    }
}`,
          check: String.raw`        eq(Main.tableRow("Lin", 88), "Lin   |  88", "Lin/88 的对齐不对（数空格）");
        eq(Main.tableRow("Chen", 95), "Chen  |  95", "Chen/95 的对齐不对（数空格）");`,
        },
        {
          id: "f1-4",
          kind: "quiz",
          question: "下面哪个工具负责把 <code>.java</code> 源码编译成 <code>.class</code> 字节码？",
          options: ["java", "javac", "jar", "jdb"],
          answer: 1,
          explain:
            "<code>javac</code> 是编译器；<code>java</code> 启动 JVM 执行已编译的类；<code>jar</code> 打包，<code>jdb</code> 调试。源码到字节码这一步只由编译器完成。",
        },
      ],
      further: [
        "《Java 核心技术 卷 I》第 2 章：Java 程序设计环境 —— 安装 JDK、编译与运行、类加载的起点。",
        "《Head First Java》第 1 章：基本概念 —— 用最直白的方式解释类、main 与字节码。",
        "Oracle 官方教程：Getting Started with Java（docs.oracle.com/javase/tutorial/getStarted/）。",
      ],
    },

    /* ============================================================ 02 */
    {
      id: "types",
      title: "基本类型、包装类与 String 的陷阱",
      summary:
        "Java 的类型系统比 Python 严格得多：整数会溢出、浮点数不精确、包装类会缓存、String 不可变。这一节把这些“看起来会、实际天天踩”的点一次讲透。",
      level: "基础重塑",
      minutes: 26,
      objectives: [
        "记住 8 种基本类型及其取值范围，知道何时该用 long",
        "解释整数溢出和浮点误差，用 BigDecimal 处理金额",
        "区分类的基本类型、包装类和自动装箱",
        "正确比较 String，理解常量池与 equals",
      ],
      sections: [
        { type: "h", text: "8 种基本类型：先记住边界" },
        {
          type: "table",
          head: ["类型", "字节", "范围 / 说明", "默认值"],
          rows: [
            ["byte", "1", "-128 ~ 127", "0"],
            ["short", "2", "-32768 ~ 32767", "0"],
            ["int", "4", "-2³¹ ~ 2³¹-1（约 ±21 亿）", "0"],
            ["long", "8", "-2⁶³ ~ 2⁶³-1，字面量加 L", "0L"],
            ["float", "4", "约 7 位有效数字，字面量加 f", "0.0f"],
            ["double", "8", "约 15 位有效数字，默认小数类型", "0.0d"],
            ["char", "2", "0 ~ 65535，Unicode 字符", "'\\u0000'"],
            ["boolean", "—", "true / false，大小由 JVM 决定", "false"],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "int 只有 21 亿的空间",
          html: "订单号、时间戳（毫秒）、文件大小都很容易超过 <code>int</code>。凡是可能超过 21 亿的计数，直接用 <code>long</code>；时间戳统一用 <code>long</code> 或 <code>Instant</code>。",
        },
        { type: "h", text: "溢出不会报错，只会悄悄变成负数" },
        {
          type: "code",
          file: "Overflow.java",
          code: String.raw`public class Overflow {
    public static void main(String[] args) {
        int max = Integer.MAX_VALUE;
        System.out.println(max + 1);              // -2147483648
        System.out.println(Math.addExact(max, 1)); // 抛 ArithmeticException

        long big = 9_000_000_000L;                 // 下划线只是可读性
        System.out.println(big);
    }
}`,
          output: "-2147483648\nException in thread \"main\" java.lang.ArithmeticException: integer overflow\n9000000000",
        },
        {
          type: "p",
          html: "Java 的整数运算默认静默溢出，不会像 Python 那样自动转大整数。需要严格检查时用 <code>Math.addExact</code> / <code>multiplyExact</code>，溢出会抛异常而不是给错数。",
        },
        { type: "h", text: "浮点数不精确，金额别用 double" },
        {
          type: "code",
          file: "Money.java",
          code: String.raw`import java.math.BigDecimal;

public class Money {
    public static void main(String[] args) {
        System.out.println(0.1 + 0.2);                       // 0.30000000000000004
        System.out.println(new BigDecimal("0.1")
                .add(new BigDecimal("0.2")));                 // 0.3

        double price = 19.99;
        System.out.println(price * 3);                        // 59.97000000000001
    }
}`,
          output: "0.30000000000000004\n0.3\n59.97000000000001",
        },
        {
          type: "callout",
          tone: "deep",
          title: "金额的行业惯例",
          html: "用 <code>BigDecimal</code> 并以<strong>字符串</strong>构造（<code>new BigDecimal(\"0.1\")</code>），不要用 <code>new BigDecimal(0.1)</code>，否则会把二进制误差原样带进来。比较用 <code>compareTo</code> 而不是 <code>equals</code>（后者会比较 scale）。",
        },
        { type: "h", text: "char 与 Unicode" },
        {
          type: "code",
          file: "CharDemo.java",
          code: String.raw`public class CharDemo {
    public static void main(String[] args) {
        char c = 'A';
        System.out.println((char) (c + 1));  // B
        System.out.println((int) c);          // 65
        char cn = '中';
        System.out.println(cn);
        System.out.println(Character.isLetter(cn)); // true
    }
}`,
          output: "B\n65\n中\ntrue",
        },
        { type: "h", text: "基本类型、包装类与自动装箱" },
        {
          type: "table",
          head: ["基本类型", "包装类", "什么时候用包装类"],
          rows: [
            ["int", "Integer", "集合、泛型、允许 null 的字段"],
            ["long", "Long", "同上"],
            ["double", "Double", "同上"],
            ["boolean", "Boolean", "三态（true/false/null）"],
            ["char", "Character", "同上"],
          ],
        },
        {
          type: "code",
          file: "Boxing.java",
          code: String.raw`public class Boxing {
    public static void main(String[] args) {
        Integer a = 127, b = 127;
        Integer c = 128, d = 128;
        System.out.println(a == b);  // true：-128~127 走缓存
        System.out.println(c == d);  // false：两个不同对象

        Integer n = null;
        int x = n;                   // NullPointerException
    }
}`,
          output: "true\nfalse\nException in thread \"main\" java.lang.NullPointerException",
        },
        {
          type: "callout",
          tone: "warn",
          title: "比较包装类永远用 equals",
          html: "自动装箱在 <code>-128 ~ 127</code> 范围内复用缓存对象，所以 <code>==</code> 有时 true 有时 false。这是 Java 最经典的面试题，也是线上事故来源。包装类比较一律 <code>Objects.equals(a, b)</code> 或先拆箱成基本类型。",
        },
        { type: "h", text: "String：不可变、常量池、equals" },
        {
          type: "code",
          file: "StringDemo.java",
          code: String.raw`public class StringDemo {
    public static void main(String[] args) {
        String a = "java";
        String b = "java";
        String c = new String("java");

        System.out.println(a == b);          // true：同一个常量池对象
        System.out.println(a == c);          // false：new 出来的新对象
        System.out.println(a.equals(c));     // true：内容相同

        String s = "abc";
        s.toUpperCase();                     // 返回值被丢弃
        System.out.println(s);               // 仍然是 abc
    }
}`,
          output: "true\nfalse\ntrue\nabc",
        },
        {
          type: "p",
          html: "String 是不可变对象：所有“修改”方法都返回新字符串，原对象不变。这也让 String 可以安全地做 HashMap 的 key、可以共享常量池。大量拼接时用 <code>StringBuilder</code>，不要用 <code>+</code> 堆循环。",
        },
        { type: "h", text: "var：只是省略类型，不是动态类型" },
        {
          type: "code",
          file: "VarDemo.java",
          code: String.raw`import java.util.ArrayList;

public class VarDemo {
    public static void main(String[] args) {
        var list = new ArrayList<String>();
        list.add("a");
        // var n = 1; n = "x";   // 编译失败：var 一旦推断就固定
        for (var item : list) {
            System.out.println(item);
        }
    }
}`,
          output: "a",
        },
        {
          type: "list",
          items: [
            "<code>var</code> 只能用于局部变量，不能用于字段、方法参数、返回值。",
            "必须初始化，编译器才能推断。",
            "<code>var</code> 让代码更短，但不要用它掩盖复杂的泛型类型；可读性优先。",
          ],
        },
      ],
      exercises: [
        {
          id: "f2-1",
          kind: "code",
          title: "整数除法与溢出",
          difficulty: "★★☆",
          prompt:
            "实现 <code>average(int a, int b)</code> 返回两个整数的平均值。要求结果精确到小数，并且当 <code>a = b = Integer.MAX_VALUE</code> 时也不能溢出。",
          starter: String.raw`public class Main {
    static double average(int a, int b) {
        return (a + b) / 2;   // TODO: 这里有两个问题
    }

    public static void main(String[] args) {
        System.out.println(average(3, 4));
        System.out.println(average(Integer.MAX_VALUE, Integer.MAX_VALUE));
    }
}`,
          hints: [
            "整数除以整数，结果还是整数：<code>(3 + 4) / 2</code> 得到 3。",
            "<code>a + b</code> 可能先溢出，再除以 2.0。先把其中一个转成 long。",
          ],
          solution: String.raw`public class Main {
    static double average(int a, int b) {
        return ((long) a + b) / 2.0;
    }

    public static void main(String[] args) {
        System.out.println(average(3, 4));
        System.out.println(average(Integer.MAX_VALUE, Integer.MAX_VALUE));
    }
}`,
          check: String.raw`        near(Main.average(3, 4), 3.5, 0.0001, "average(3, 4) 应为 3.5");
        near(Main.average(1, 2), 1.5, 0.0001, "average(1, 2) 应为 1.5");
        near(Main.average(Integer.MAX_VALUE, Integer.MAX_VALUE), 2147483647.0, 0.0001, "大数相加不能溢出");
        near(Main.average(-3, 4), 0.5, 0.0001, "负数也要正确");`,
        },
        {
          id: "f2-2",
          kind: "code",
          title: "null 安全的字符串比较",
          difficulty: "★★☆",
          prompt:
            "实现 <code>sameText(String a, String b)</code>，判断两个字符串内容是否相同，要求对 <code>null</code> 安全：两个都是 null 返回 true，只有一个 null 返回 false。",
          starter: String.raw`public class Main {
    static boolean sameText(String a, String b) {
        return a == b;   // TODO: 改成内容比较
    }

    public static void main(String[] args) {
        System.out.println(sameText("java", new String("java")));
        System.out.println(sameText(null, null));
    }
}`,
          hints: [
            "<code>a == b</code> 比较的是引用地址。",
            "<code>a.equals(b)</code> 在 a 为 null 时会抛空指针。",
            "标准库已经有 <code>java.util.Objects.equals(a, b)</code>。",
          ],
          solution: String.raw`import java.util.Objects;

public class Main {
    static boolean sameText(String a, String b) {
        return Objects.equals(a, b);
    }

    public static void main(String[] args) {
        System.out.println(sameText("java", new String("java")));
        System.out.println(sameText(null, null));
    }
}`,
          check: String.raw`        check(Main.sameText("java", new String("java")), "内容相同的不同对象应返回 true");
        check(Main.sameText(null, null), "两个 null 应返回 true");
        check(!Main.sameText("java", null), "一个 null 应返回 false");
        check(!Main.sameText("java", "Java"), "大小写不同应返回 false");`,
        },
        {
          id: "f2-3",
          kind: "code",
          title: "用 BigDecimal 算金额",
          difficulty: "★★☆",
          prompt:
            "实现 <code>addMoney(String a, String b)</code>，把两个十进制金额字符串相加并返回结果，要求 <code>addMoney(\"0.10\", \"0.20\")</code> 返回 <code>0.30</code>。",
          starter: String.raw`import java.math.BigDecimal;

public class Main {
    static String addMoney(String a, String b) {
        // TODO: 用 BigDecimal，不要用 double
        return "";
    }

    public static void main(String[] args) {
        System.out.println(addMoney("0.10", "0.20"));
    }
}`,
          hints: [
            "<code>new BigDecimal(a).add(new BigDecimal(b))</code>。",
            "用 <code>toPlainString()</code>，避免出现科学计数法。",
          ],
          solution: String.raw`import java.math.BigDecimal;

public class Main {
    static String addMoney(String a, String b) {
        return new BigDecimal(a).add(new BigDecimal(b)).toPlainString();
    }

    public static void main(String[] args) {
        System.out.println(addMoney("0.10", "0.20"));
    }
}`,
          check: String.raw`        eq(Main.addMoney("0.10", "0.20"), "0.30", "经典浮点误差场景");
        eq(Main.addMoney("1.00", "2.5"), "3.50", "小数位数按较大 scale 保留");
        eq(Main.addMoney("999999999999999999.99", "0.01"), "1000000000000000000.00", "大金额也不能丢精度");`,
        },
        {
          id: "f2-4",
          kind: "quiz",
          question: "执行 <code>Integer a = 128; Integer b = 128; System.out.println(a == b);</code>，输出是什么？",
          options: ["true", "false", "编译错误", "随机 true / false"],
          answer: 1,
          explain:
            "自动装箱只缓存 <code>-128 ~ 127</code>。128 超出缓存范围，会创建两个不同的 Integer 对象，<code>==</code> 比较引用地址得到 false。比较内容应使用 <code>equals</code>。",
        },
      ],
      further: [
        "《Java 核心技术 卷 I》第 3 章：Java 的基本程序设计结构 —— 数据类型、变量、字符串。",
        "《Effective Java 第 3 版》第 3 章：所有对象都通用的方法 —— equals 的契约与实现。",
        "《阿里巴巴 Java 开发手册》：浮点数与 BigDecimal 的强制规约，金额字段的类型约定。",
      ],
    },

    /* ============================================================ 03 */
    {
      id: "control",
      title: "分支、循环与 switch 表达式",
      summary:
        "流程控制本身不难，难的是边界条件：循环少一次、多一次，switch 忘了 break，条件写反。这一节用可判题的小函数把这些边界逼出来。",
      level: "基础重塑",
      minutes: 24,
      objectives: [
        "熟练使用 if / else、三元表达式与短路逻辑",
        "区分 switch 语句穿透与 switch 表达式",
        "写对 for、while、do-while 的边界，知道何时用哪种",
        "使用 break / continue / 标签跳出多层循环",
      ],
      sections: [
        { type: "h", text: "if / else 与短路求值" },
        {
          type: "code",
          file: "Condition.java",
          code: String.raw`public class Condition {
    public static void main(String[] args) {
        String name = null;
        // 顺序很重要：先判 null，再调用方法
        if (name != null && name.length() > 3) {
            System.out.println("长名字");
        } else {
            System.out.println("空或短名字");
        }

        int score = 72;
        String level = score >= 60 ? "通过" : "不及格";
        System.out.println(level);
    }
}`,
          output: "空或短名字\n通过",
        },
        {
          type: "callout",
          tone: "tip",
          title: "&& 与 || 会短路",
          html: "<code>a && b</code> 在 a 为 false 时不再计算 b；<code>a || b</code> 在 a 为 true 时不再计算 b。所以 <code>name != null && name.length() > 3</code> 是安全的，反过来写就会空指针。",
        },
        { type: "h", text: "switch 语句：别忘了 break" },
        {
          type: "code",
          file: "SwitchOld.java",
          code: String.raw`public class SwitchOld {
    public static void main(String[] args) {
        int day = 3;
        switch (day) {
            case 1:
                System.out.println("周一");
                break;
            case 2:
                System.out.println("周二");
                break;
            default:
                System.out.println("其他");
        }
    }
}`,
          output: "周二",
        },
        {
          type: "p",
          html: "忘了 <code>break</code> 会<strong>穿透</strong>到下一个 case，一直到遇到 break 或 switch 结束。有时这是刻意利用的特性（比如多个 case 共用一个分支），但更多时候是 bug。",
        },
        { type: "h", text: "switch 表达式：更安全、能返回值" },
        {
          type: "code",
          file: "Grade.java",
          code: String.raw`public class Grade {
    static String level(int score) {
        return switch (score / 10) {
            case 10, 9 -> "A";
            case 8 -> "B";
            case 7 -> "C";
            default -> "D";
        };
    }

    public static void main(String[] args) {
        System.out.println(level(92));
    }
}`,
          output: "A",
        },
        {
          type: "list",
          items: [
            "<code>case 10, 9</code> 用逗号并列多个值，不需要写两个 case。",
            "箭头 <code>-></code> 不会穿透，也不需要在分支里写 break。",
            "整个 switch 必须有返回值，或者有 <code>default</code>；编译器会检查穷尽性。",
            "需要写多行逻辑时，用大括号 + <code>yield</code> 返回值。",
          ],
        },
        { type: "h", text: "三种循环：选对边界" },
        {
          type: "table",
          head: ["循环", "什么时候用", "最少执行次数"],
          rows: [
            ["for", "次数已知，或需要索引", "0"],
            ["for-each", "遍历数组 / 集合，不需要索引", "0"],
            ["while", "条件先判断，次数未知", "0"],
            ["do-while", "至少执行一次，再判断", "1"],
          ],
        },
        {
          type: "code",
          file: "Loops.java",
          code: String.raw`public class Loops {
    public static void main(String[] args) {
        for (int i = 0; i < 3; i++) {
            System.out.print(i + " ");
        }
        System.out.println();

        int[] nums = {2, 4, 6};
        for (int n : nums) {
            System.out.print(n + " ");
        }
        System.out.println();

        int n = 0;
        do {
            n++;
        } while (n < 2);
        System.out.println(n);
    }
}`,
          output: "0 1 2 \n2 4 6 \n2",
        },
        { type: "h", text: "break、continue 与标签" },
        {
          type: "code",
          file: "LabelDemo.java",
          code: String.raw`public class LabelDemo {
    public static void main(String[] args) {
        outer:
        for (int i = 0; i < 3; i++) {
            for (int j = 0; j < 3; j++) {
                if (i * j == 2) {
                    System.out.println("找到：" + i + " × " + j);
                    break outer;   // 直接跳出两层
                }
            }
        }
    }
}`,
          output: "找到：1 × 2",
        },
        {
          type: "callout",
          tone: "warn",
          title: "循环里改集合会抛异常",
          html: "用 for-each 遍历 <code>ArrayList</code> 时调用 <code>list.remove(...)</code> 会抛 <code>ConcurrentModificationException</code>。要么用 <code>Iterator.remove()</code>，要么用 <code>list.removeIf(...)</code>，要么改成索引循环。",
        },
        { type: "h", text: "作用域：变量在括号里出生，在括号里结束" },
        {
          type: "code",
          file: "Scope.java",
          code: String.raw`public class Scope {
    public static void main(String[] args) {
        int x = 1;
        {
            int y = 2;
            System.out.println(x + y);
        }
        // System.out.println(y);  // 编译错误：y 已离开作用域
    }
}`,
          output: "3",
        },
      ],
      exercises: [
        {
          id: "f3-1",
          kind: "code",
          title: "FizzBuzz",
          difficulty: "★★☆",
          prompt:
            "实现 <code>fizzBuzz(int n)</code>：能被 3 整除返回 <code>Fizz</code>，能被 5 整除返回 <code>Buzz</code>，同时能被 3 和 5 整除返回 <code>FizzBuzz</code>，否则返回数字本身的字符串。",
          starter: String.raw`public class Main {
    static String fizzBuzz(int n) {
        // TODO
        return "";
    }

    public static void main(String[] args) {
        for (int i = 1; i <= 15; i++) {
            System.out.println(fizzBuzz(i));
        }
    }
}`,
          hints: [
            "先判断 15 的倍数，再判断 3 或 5；顺序反了会把 FizzBuzz 拆成 Fizz。",
            "返回数字时用 <code>String.valueOf(n)</code> 或 <code>Integer.toString(n)</code>。",
          ],
          solution: String.raw`public class Main {
    static String fizzBuzz(int n) {
        if (n % 15 == 0) return "FizzBuzz";
        if (n % 3 == 0) return "Fizz";
        if (n % 5 == 0) return "Buzz";
        return String.valueOf(n);
    }

    public static void main(String[] args) {
        for (int i = 1; i <= 15; i++) {
            System.out.println(fizzBuzz(i));
        }
    }
}`,
          check: String.raw`        eq(Main.fizzBuzz(15), "FizzBuzz", "15 的倍数");
        eq(Main.fizzBuzz(3), "Fizz", "3 的倍数");
        eq(Main.fizzBuzz(5), "Buzz", "5 的倍数");
        eq(Main.fizzBuzz(7), "7", "既不是 3 也不是 5 的倍数");
        eq(Main.fizzBuzz(30), "FizzBuzz", "30 的倍数");`,
        },
        {
          id: "f3-2",
          kind: "code",
          title: "闰年判断",
          difficulty: "★★☆",
          prompt:
            "实现 <code>isLeapYear(int year)</code>：能被 4 整除但不能被 100 整除，或者能被 400 整除的年份是闰年。",
          starter: String.raw`public class Main {
    static boolean isLeapYear(int year) {
        // TODO
        return false;
    }

    public static void main(String[] args) {
        System.out.println(isLeapYear(2024));
        System.out.println(isLeapYear(1900));
    }
}`,
          hints: [
            "条件可以写成 <code>(year % 4 == 0 && year % 100 != 0) || year % 400 == 0</code>。",
            "运算符优先级：先 && 后 ||，不确定就加括号。",
          ],
          solution: String.raw`public class Main {
    static boolean isLeapYear(int year) {
        return (year % 4 == 0 && year % 100 != 0) || year % 400 == 0;
    }

    public static void main(String[] args) {
        System.out.println(isLeapYear(2024));
        System.out.println(isLeapYear(1900));
    }
}`,
          check: String.raw`        check(Main.isLeapYear(2024), "2024 是闰年");
        check(!Main.isLeapYear(1900), "1900 不是闰年（能被 100 整除但不能被 400）");
        check(Main.isLeapYear(2000), "2000 是闰年（能被 400 整除）");
        check(!Main.isLeapYear(2023), "2023 不是闰年");`,
        },
        {
          id: "f3-3",
          kind: "code",
          title: "数位求和（处理负数）",
          difficulty: "★★☆",
          prompt:
            "实现 <code>sumDigits(int n)</code>，返回整数各位数字之和，负数按绝对值处理。例如 <code>-123</code> 返回 6，<code>0</code> 返回 0。",
          starter: String.raw`public class Main {
    static int sumDigits(int n) {
        // TODO: 用 while 循环不断取余、除以 10
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(sumDigits(-123));
        System.out.println(sumDigits(0));
    }
}`,
          hints: [
            "<code>n % 10</code> 取最后一位，<code>n / 10</code> 去掉最后一位。",
            "先用 <code>Math.abs((long) n)</code> 处理 <code>Integer.MIN_VALUE</code> 的边界。",
          ],
          solution: String.raw`public class Main {
    static int sumDigits(int n) {
        long value = Math.abs((long) n);
        int sum = 0;
        while (value > 0) {
            sum += value % 10;
            value /= 10;
        }
        return sum;
    }

    public static void main(String[] args) {
        System.out.println(sumDigits(-123));
        System.out.println(sumDigits(0));
    }
}`,
          check: String.raw`        eq(Main.sumDigits(-123), 6, "负数取绝对值后求和");
        eq(Main.sumDigits(0), 0, "0 的各位和为 0");
        eq(Main.sumDigits(987654321), 45, "多位数求和");
        eq(Main.sumDigits(Integer.MIN_VALUE), 47, "Integer.MIN_VALUE 的绝对值溢出，需用 long");`,
        },
        {
          id: "f3-4",
          kind: "quiz",
          question: "下面这段代码会输出什么？<br><code>int x = 2; switch (x) { case 1: System.out.print(\"a\"); case 2: System.out.print(\"b\"); case 3: System.out.print(\"c\"); }</code>",
          options: ["b", "bc", "abc", "编译错误"],
          answer: 1,
          explain:
            "从匹配的 case 2 开始执行，因为后面没有 break，会继续穿透执行 case 3，输出 <code>bc</code>。这就是 switch 语句的 fall-through，也是 switch 表达式改用箭头语法要解决的问题。",
        },
      ],
      further: [
        "《Java 核心技术 卷 I》第 3 章：控制流程 —— 条件、循环、switch。",
        "《Effective Java 第 3 版》条目 34：用枚举代替 int 常量（switch 的更好替代）。",
        "Oracle 官方教程：Language Basics — Control Flow Statements。",
      ],
    },

    /* ============================================================ 04 */
    {
      id: "methods-arrays",
      title: "方法、值传递与数组",
      summary:
        "“Java 是值传递”这句话人人会背，但遇到数组和对象时又说不清。这一节把方法签名、重载、递归和数组操作讲清楚，并用判题验证你的理解。",
      level: "基础重塑",
      minutes: 28,
      objectives: [
        "写出清晰的方法签名，理解重载的解析规则",
        "解释 Java 只有值传递，并能预测数组/对象参数的行为",
        "熟练创建、遍历、拷贝、排序一维与二维数组",
        "用递归解决可分解的小问题，并知道递归的代价",
      ],
      sections: [
        { type: "h", text: "方法签名：名字 + 参数列表" },
        {
          type: "code",
          file: "Methods.java",
          code: String.raw`public class Methods {
    static int add(int a, int b) {
        return a + b;
    }

    static double add(double a, double b) {
        return a + b;
    }

    static int add(int a, int b, int c) {
        return a + b + c;
    }

    public static void main(String[] args) {
        System.out.println(add(1, 2));
        System.out.println(add(1.5, 2.5));
        System.out.println(add(1, 2, 3));
    }
}`,
          output: "3\n4.0\n6",
        },
        {
          type: "p",
          html: "返回类型<strong>不算</strong>方法签名的一部分，所以不能只靠返回值区分重载。参数个数、类型、顺序不同才算不同的方法。调用时编译器按“最精确匹配”选择重载，遇到歧义会直接编译失败。",
        },
        { type: "h", text: "Java 只有值传递" },
        {
          type: "code",
          file: "PassByValue.java",
          code: String.raw`public class PassByValue {
    static void swap(int a, int b) {
        int temp = a;
        a = b;
        b = temp;
    }

    static void fill(int[] arr) {
        arr[0] = 99;
    }

    public static void main(String[] args) {
        int x = 1, y = 2;
        swap(x, y);
        System.out.println(x + " " + y);   // 1 2，没变

        int[] nums = {1, 2, 3};
        fill(nums);
        System.out.println(nums[0]);      // 99，变了
    }
}`,
          output: "1 2\n99",
        },
        {
          type: "callout",
          tone: "deep",
          title: "为什么数组“变了”却仍是值传递",
          html: "方法拿到的是<strong>引用的副本</strong>：副本和原变量指向同一个数组对象，所以通过副本修改数组内容，调用方能看到。但把副本指向新对象（<code>arr = new int[]{...}</code>）不会改变调用方的引用。<code>swap(int a, int b)</code> 交换的只是副本，所以外面不变。",
        },
        { type: "h", text: "可变参数：本质是数组" },
        {
          type: "code",
          file: "Varargs.java",
          code: String.raw`public class Varargs {
    static int sum(int... nums) {
        int total = 0;
        for (int n : nums) total += n;
        return total;
    }

    public static void main(String[] args) {
        System.out.println(sum(1, 2, 3));
        System.out.println(sum());
        System.out.println(sum(new int[]{4, 5}));
    }
}`,
          output: "6\n0\n9",
        },
        {
          type: "p",
          html: "<code>int... nums</code> 在方法内部就是 <code>int[]</code>。可变参数必须是参数列表的最后一个，而且一个方法只能有一个。",
        },
        { type: "h", text: "数组：长度固定，默认值明确" },
        {
          type: "code",
          file: "ArrayBasics.java",
          code: String.raw`import java.util.Arrays;

public class ArrayBasics {
    public static void main(String[] args) {
        int[] scores = new int[3];          // {0, 0, 0}
        int[] primes = {2, 3, 5, 7};        // 直接初始化
        System.out.println(primes.length);  // 4，不是方法

        System.out.println(Arrays.toString(primes));
        int[] copy = Arrays.copyOf(primes, 6); // 多出的位置补 0
        System.out.println(Arrays.toString(copy));

        Arrays.sort(copy);
        System.out.println(Arrays.toString(copy));

        try {
            System.out.println(primes[4]);
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("越界：" + e.getMessage());
        }
    }
}`,
          output: "4\n[2, 3, 5, 7]\n[2, 3, 5, 7, 0, 0]\n[0, 0, 2, 3, 5, 7]\n越界：Index 4 out of bounds for length 4",
        },
        { type: "h", text: "二维数组：数组的数组" },
        {
          type: "code",
          file: "Matrix.java",
          code: String.raw`import java.util.Arrays;

public class Matrix {
    public static void main(String[] args) {
        int[][] matrix = {
            {1, 2, 3},
            {4, 5, 6},
        };
        System.out.println(matrix.length);      // 2 行
        System.out.println(matrix[0].length);   // 3 列
        System.out.println(Arrays.deepToString(matrix));

        int[][] jagged = new int[3][];
        jagged[0] = new int[]{1};
        jagged[1] = new int[]{2, 3};
        System.out.println(Arrays.deepToString(jagged));
    }
}`,
          output: "2\n3\n[[1, 2, 3], [4, 5, 6]]\n[[1], [2, 3], null]",
        },
        {
          type: "callout",
          tone: "warn",
          title: "数组的常见坑",
          html: "<code>arr.length</code> 是字段，不是 <code>length()</code>；<code>Arrays.toString</code> 只适合一维，二维要用 <code>deepToString</code>；数组不能直接比较内容，<code>==</code> 比的是引用；返回数组时要考虑防御性拷贝。",
        },
        { type: "h", text: "递归：把问题缩小一号" },
        {
          type: "code",
          file: "Recursion.java",
          code: String.raw`public class Recursion {
    static long factorial(int n) {
        if (n <= 1) return 1;          // 递归出口
        return n * factorial(n - 1);   // 规模缩小
    }

    public static void main(String[] args) {
        System.out.println(factorial(5));  // 120
    }
}`,
          output: "120",
        },
        {
          type: "p",
          html: "递归必须同时具备出口和规模缩小，否则就是栈溢出。Java 没有尾递归优化，深度过大（比如几万层）会抛 <code>StackOverflowError</code>，生产代码优先考虑循环或显式栈。",
        },
      ],
      exercises: [
        {
          id: "f4-1",
          kind: "code",
          title: "反转数组（不修改原数组）",
          difficulty: "★★☆",
          prompt:
            "实现 <code>reverse(int[] arr)</code>，返回一个顺序反转的新数组，<strong>不能修改传入的数组</strong>。空数组或 null 要能安全处理：null 返回空数组。",
          starter: String.raw`public class Main {
    static int[] reverse(int[] arr) {
        // TODO: 返回新数组，别动 arr
        return new int[0];
    }

    public static void main(String[] args) {
        System.out.println(java.util.Arrays.toString(reverse(new int[]{1, 2, 3})));
    }
}`,
          hints: [
            "先 <code>new int[arr.length]</code>，再按 <code>result[i] = arr[arr.length - 1 - i]</code> 填。",
            "null 判断放在最前面。",
          ],
          solution: String.raw`public class Main {
    static int[] reverse(int[] arr) {
        if (arr == null) return new int[0];
        int[] result = new int[arr.length];
        for (int i = 0; i < arr.length; i++) {
            result[i] = arr[arr.length - 1 - i];
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(java.util.Arrays.toString(reverse(new int[]{1, 2, 3})));
    }
}`,
          check: String.raw`        int[] src = {1, 2, 3};
        eq(Arrays.toString(Main.reverse(src)), "[3, 2, 1]", "反转结果不对");
        eq(Arrays.toString(src), "[1, 2, 3]", "不能修改传入的数组");
        eq(Arrays.toString(Main.reverse(new int[0])), "[]", "空数组应返回空数组");
        eq(Arrays.toString(Main.reverse(null)), "[]", "null 应返回空数组而不是抛异常");`,
        },
        {
          id: "f4-2",
          kind: "code",
          title: "中位数",
          difficulty: "★★★",
          prompt:
            "实现 <code>median(int[] arr)</code>，返回中位数。奇数个取中间值，偶数个取中间两个的平均值。要求升序排序，但不能修改原数组；空数组抛出 <code>IllegalArgumentException</code>。",
          starter: String.raw`import java.util.Arrays;

public class Main {
    static double median(int[] arr) {
        // TODO: 先校验，再拷贝排序
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(median(new int[]{3, 1, 2}));
        System.out.println(median(new int[]{4, 1, 3, 2}));
    }
}`,
          hints: [
            "用 <code>Arrays.copyOf</code> 或 <code>arr.clone()</code> 得到副本。",
            "偶数个：<code>(copy[n / 2 - 1] + copy[n / 2]) / 2.0</code>，注意除以 2.0。",
          ],
          solution: String.raw`import java.util.Arrays;

public class Main {
    static double median(int[] arr) {
        if (arr == null || arr.length == 0) {
            throw new IllegalArgumentException("数组不能为空");
        }
        int[] copy = Arrays.copyOf(arr, arr.length);
        Arrays.sort(copy);
        int n = copy.length;
        if (n % 2 == 1) {
            return copy[n / 2];
        }
        return (copy[n / 2 - 1] + copy[n / 2]) / 2.0;
    }

    public static void main(String[] args) {
        System.out.println(median(new int[]{3, 1, 2}));
        System.out.println(median(new int[]{4, 1, 3, 2}));
    }
}`,
          check: String.raw`        near(Main.median(new int[]{3, 1, 2}), 2.0, 0.0001, "奇数个中位数");
        near(Main.median(new int[]{4, 1, 3, 2}), 2.5, 0.0001, "偶数个取平均");
        near(Main.median(new int[]{5}), 5.0, 0.0001, "单元素");
        int[] original = {4, 1, 3, 2};
        Main.median(original);
        eq(Arrays.toString(original), "[4, 1, 3, 2]", "不能修改原数组");
        boolean thrown = false;
        try { Main.median(new int[0]); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "空数组应抛出 IllegalArgumentException");`,
        },
        {
          id: "f4-3",
          kind: "code",
          title: "矩阵转置",
          difficulty: "★★★",
          prompt:
            "实现 <code>transpose(int[][] matrix)</code>，返回转置后的二维数组：原 <code>m 行 n 列</code> 变成 <code>n 行 m 列</code>，元素 <code>[i][j]</code> 移到 <code>[j][i]</code>。",
          starter: String.raw`public class Main {
    static int[][] transpose(int[][] matrix) {
        // TODO
        return new int[0][0];
    }

    public static void main(String[] args) {
        int[][] m = {{1, 2, 3}, {4, 5, 6}};
        System.out.println(java.util.Arrays.deepToString(transpose(m)));
    }
}`,
          hints: [
            "新数组的行数是原数组的列数：<code>matrix[0].length</code>。",
            "双层循环里 <code>result[j][i] = matrix[i][j]</code>。",
          ],
          solution: String.raw`public class Main {
    static int[][] transpose(int[][] matrix) {
        if (matrix == null || matrix.length == 0) return new int[0][0];
        int rows = matrix.length;
        int cols = matrix[0].length;
        int[][] result = new int[cols][rows];
        for (int i = 0; i < rows; i++) {
            for (int j = 0; j < cols; j++) {
                result[j][i] = matrix[i][j];
            }
        }
        return result;
    }

    public static void main(String[] args) {
        int[][] m = {{1, 2, 3}, {4, 5, 6}};
        System.out.println(java.util.Arrays.deepToString(transpose(m)));
    }
}`,
          check: String.raw`        eq(Arrays.deepToString(Main.transpose(new int[][]{{1, 2, 3}, {4, 5, 6}})),
           "[[1, 4], [2, 5], [3, 6]]", "2x3 转置应为 3x2");
        eq(Arrays.deepToString(Main.transpose(new int[][]{{1}})), "[[1]]", "1x1 矩阵");
        eq(Arrays.deepToString(Main.transpose(null)), "[]", "null 应返回空数组");`,
        },
        {
          id: "f4-4",
          kind: "quiz",
          question: "关于 Java 的参数传递，下面哪句描述是正确的？",
          options: [
            "基本类型传值，对象传引用，所以对象内容会被方法修改",
            "全部是值传递；对象和数组传入的是引用的副本，副本仍指向同一对象",
            "方法内给参数重新赋值，调用方的变量也会跟着变",
            "只有数组是引用传递，普通对象是值传递",
          ],
          answer: 1,
          explain:
            "Java 只有值传递。对象/数组传入的是引用的一份拷贝，拷贝和原变量指向同一个堆对象，所以修改对象内容调用方可见；但让参数指向新对象，不会改变调用方的引用。",
        },
      ],
      further: [
        "《Java 核心技术 卷 I》第 4 章：对象与类 —— 方法参数、重载、构造器。",
        "《Java 核心技术 卷 I》第 3 章：数组 —— 创建、拷贝、排序。",
        "《Effective Java 第 3 版》条目 49：检查参数有效性。",
      ],
    },
  ],
});
