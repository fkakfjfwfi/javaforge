/* 模块 04 · 实战与工程化
   两节课把“会写 Java”升级成“能交付 Java 项目”：构建工具、测试、日志、分层与依赖方向。 */
window.CURRICULUM = window.CURRICULUM || { modules: [] };
window.CURRICULUM.modules.push({
  id: "projects",
  index: "04",
  title: "实战与工程化",
  tagline: "从单文件练习到可交付项目",
  description:
    "代码能跑不等于能交付。工程化解决的是另一类问题：依赖怎么管、测试怎么写、日志怎么留、层与层之间怎么不互相污染。学完这两节，再去项目工坊做完整项目。",
  accent: "#b06a12",
  lessons: [
    /* ============================================================ 13 */
    {
      id: "engineering",
      title: "Maven、JUnit 与日志：工程化基本功",
      summary:
        "面试问“你平时怎么管理依赖”，答“下载 jar 包放 lib 目录”基本就结束了。这一节把标准项目结构、依赖作用域、单元测试和日志讲成可操作的清单。",
      level: "实战",
      minutes: 30,
      objectives: [
        "按 Maven 标准目录组织 Java 项目",
        "理解 compile / test / provided / runtime 依赖作用域",
        "用 JUnit 5 写可读的单元测试，知道 FIRST 原则",
        "用 SLF4J + 日志级别替代 System.out，掌握断点调试的基本操作",
      ],
      sections: [
        { type: "h", text: "标准目录：让任何人一眼看懂" },
        {
          type: "code",
          file: "project-tree",
          lang: "text",
          plain: true,
          code: `demo/
├── pom.xml
├── src/
│   ├── main/
│   │   ├── java/com/example/demo/
│   │   │   ├── App.java
│   │   │   ├── service/
│   │   │   ├── repository/
│   │   │   └── domain/
│   │   └── resources/
│   │       ├── application.properties
│   │       └── logback.xml
│   └── test/
│       └── java/com/example/demo/
│           └── service/OrderServiceTest.java
└── target/（构建产物，不要提交）`,
        },
        {
          type: "p",
          html: "<code>src/main/java</code> 放生产代码，<code>src/test/java</code> 放测试，<code>src/main/resources</code> 放配置。测试代码和生产代码用同样的包名，但位于不同源码根，Maven 会自动分开编译。",
        },
        { type: "h", text: "Maven：坐标与依赖作用域" },
        {
          type: "code",
          file: "pom.xml",
          code: String.raw`<project>
  <modelVersion>4.0.0</modelVersion>
  <groupId>com.example</groupId>
  <artifactId>demo</artifactId>
  <version>1.0.0</version>

  <properties>
    <maven.compiler.release>21</maven.compiler.release>
    <project.build.sourceEncoding>UTF-8</project.build.sourceEncoding>
  </properties>

  <dependencies>
    <dependency>
      <groupId>org.junit.jupiter</groupId>
      <artifactId>junit-jupiter</artifactId>
      <version>5.10.2</version>
      <scope>test</scope>
    </dependency>
    <dependency>
      <groupId>org.slf4j</groupId>
      <artifactId>slf4j-api</artifactId>
      <version>2.0.13</version>
    </dependency>
  </dependencies>
</project>`,
        },
        {
          type: "table",
          head: ["scope", "编译时可用", "测试时可用", "运行/打包", "典型依赖"],
          rows: [
            ["compile（默认）", "✓", "✓", "✓", "Spring、Jackson、SLF4J"],
            ["test", "✗", "✓", "✗", "JUnit、Mockito、AssertJ"],
            ["provided", "✓", "✓", "✗", "Servlet API、Lombok"],
            ["runtime", "✗", "✓", "✓", "JDBC 驱动、日志实现"],
          ],
        },
        {
          type: "p",
          html: "常用命令：<code>mvn compile</code> 编译，<code>mvn test</code> 跑测试，<code>mvn package</code> 打包，<code>mvn dependency:tree</code> 看依赖冲突。Gradle 的思路相同，只是脚本换成 <code>build.gradle</code>。",
        },
        { type: "h", text: "JUnit 5：测试是设计工具" },
        {
          type: "code",
          file: "CalculatorTest.java",
          code: String.raw`import org.junit.jupiter.api.Test;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;

import static org.junit.jupiter.api.Assertions.*;

class CalculatorTest {
    private final Calculator calculator = new Calculator();

    @Test
    void divideByZeroShouldThrow() {
        assertThrows(ArithmeticException.class, () -> calculator.divide(1, 0));
    }

    @ParameterizedTest
    @CsvSource({"2,3,5", "-1,1,0", "0,0,0"})
    void addCases(int a, int b, int expected) {
        assertEquals(expected, calculator.add(a, b));
    }
}`,
        },
        {
          type: "list",
          items: [
            "测试方法名写“行为 + 期望”，比如 <code>divideByZeroShouldThrow</code>，不要写 <code>test1</code>。",
            "一个测试只验证一件事；断言失败信息要能直接看出哪里错了。",
            "边界优先：null、空集合、0、负数、最大值、并发。",
            "不要为了覆盖率写“只调用不断言”的测试。",
            "JUnit 5 的生命周期：<code>@BeforeEach</code> / <code>@AfterEach</code> / <code>@BeforeAll</code> / <code>@AfterAll</code>。",
          ],
        },
        {
          type: "callout",
          tone: "deep",
          title: "FIRST 原则",
          html: "Fast（快）、Independent（独立）、Repeatable（可重复）、Self-validating（自验证）、Timely（及时）。测试依赖数据库、网络、当前时间，就会变慢且不稳定；把这些依赖注入进来，用假实现或固定 <code>Clock</code> 替代。",
        },
        { type: "h", text: "日志：给排障的人留证据" },
        {
          type: "code",
          file: "OrderService.java",
          code: String.raw`import org.slf4j.Logger;
import org.slf4j.LoggerFactory;

class OrderService {
    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    void create(String userId, int amount) {
        log.debug("创建订单开始 userId={} amount={}", userId, amount);
        try {
            // 业务逻辑
            log.info("订单创建成功 userId={} amount={}", userId, amount);
        } catch (RuntimeException e) {
            log.error("订单创建失败 userId={} amount={}", userId, amount, e);
            throw e;
        }
    }
}`,
        },
        {
          type: "table",
          head: ["级别", "用途", "生产默认"],
          rows: [
            ["ERROR", "需要人介入的失败", "开"],
            ["WARN", "可恢复但需要关注", "开"],
            ["INFO", "关键业务节点（下单、支付）", "开"],
            ["DEBUG", "排查细节、参数", "关"],
            ["TRACE", "极细粒度", "关"],
          ],
        },
        {
          type: "list",
          items: [
            "用占位符 <code>{}</code>，不要字符串拼接：级别不开启时没有拼接开销。",
            "异常对象作为最后一个参数传入，日志框架才会打印完整堆栈。",
            "日志里带业务主键（orderId、userId），否则线上无法定位。",
            "不要在循环里打 INFO 日志，QPS 高时会把磁盘打满。",
          ],
        },
        { type: "h", text: "调试：比 println 更快的办法" },
        {
          type: "list",
          items: [
            "行断点：停在某一行，查看调用栈与变量。",
            "条件断点：只有 <code>orderId.equals(\"A1001\")</code> 时停下，避免在循环里手动继续几百次。",
            "异常断点：在任何 RuntimeException 抛出时停下，直接看到问题源头而不是外层 catch。",
            "Evaluate Expression：在暂停时执行表达式，验证猜想。",
            "线上问题：<code>jstack</code> 看线程栈，<code>jmap</code> / <code>jcmd</code> 看堆，<code>arthas</code> 做在线诊断。",
          ],
        },
      ],
      exercises: [
        {
          id: "p13-1",
          kind: "code",
          title: "手写一个断言工具",
          difficulty: "★★☆",
          prompt:
            "实现 <code>require(boolean condition, String message)</code>：条件为 false 时抛出 <code>IllegalArgumentException</code>，信息为传入的 message；条件为 true 时什么都不做。这就是测试框架断言的最小内核。",
          starter: String.raw`public class Main {
    static void require(boolean condition, String message) {
        // TODO
    }

    public static void main(String[] args) {
        require(2 + 2 == 4, "数学成立");
        System.out.println("继续执行");
    }
}`,
          hints: [
            "<code>if (!condition) throw new IllegalArgumentException(message);</code>。",
            "message 为 null 时也可以原样传给异常构造器。",
          ],
          solution: String.raw`public class Main {
    static void require(boolean condition, String message) {
        if (!condition) throw new IllegalArgumentException(message);
    }

    public static void main(String[] args) {
        require(2 + 2 == 4, "数学成立");
        System.out.println("继续执行");
    }
}`,
          check: String.raw`        Main.require(true, "不应抛出");
        boolean thrown = false;
        try { Main.require(false, "自定义信息"); } catch (IllegalArgumentException e) {
            thrown = "自定义信息".equals(e.getMessage());
        }
        check(thrown, "条件为 false 时应抛出 IllegalArgumentException 并保留 message");`,
        },
        {
          id: "p13-2",
          kind: "code",
          title: "输入规范化",
          difficulty: "★★☆",
          prompt:
            "实现 <code>normalize(String input)</code>：去首尾空格、转小写、把连续空白折叠成一个空格。null 返回空字符串。例如 <code>\"  Java   Stream  \"</code> 返回 <code>java stream</code>。",
          starter: String.raw`public class Main {
    static String normalize(String input) {
        // TODO
        return input;
    }

    public static void main(String[] args) {
        System.out.println(normalize("  Java   Stream  "));
    }
}`,
          hints: [
            "先判 null，再 <code>trim().toLowerCase()</code>。",
            "<code>replaceAll(\"\\\\s+\", \" \")</code> 折叠空白。",
          ],
          solution: String.raw`public class Main {
    static String normalize(String input) {
        if (input == null) return "";
        return input.trim().toLowerCase().replaceAll("\\s+", " ");
    }

    public static void main(String[] args) {
        System.out.println(normalize("  Java   Stream  "));
    }
}`,
          check: String.raw`        eq(Main.normalize("  Java   Stream  "), "java stream", "大小写与空白都要规范化");
        eq(Main.normalize("A\tB\nC"), "a b c", "制表符与换行也算空白");
        eq(Main.normalize(null), "", "null 返回空字符串");
        eq(Main.normalize("   "), "", "全空白返回空字符串");`,
        },
        {
          id: "p13-3",
          kind: "code",
          title: "解析命令行参数",
          difficulty: "★★★",
          prompt:
            "实现 <code>parseArgs(String[] args)</code>：只接受 <code>--key=value</code> 形式的参数，返回 key 到 value 的 Map。null 或空数组返回空 Map；任何不符合格式的参数抛出 <code>IllegalArgumentException</code>。",
          starter: String.raw`import java.util.*;

public class Main {
    static Map<String, String> parseArgs(String[] args) {
        // TODO
        return Map.of();
    }

    public static void main(String[] args) {
        System.out.println(parseArgs(new String[]{"--name=java", "--level=21"}));
    }
}`,
          hints: [
            "以 <code>--</code> 开头且包含 <code>=</code>，key 与 value 都不能为空。",
            "用 <code>indexOf('=')</code> 切分，不要用 <code>split(\"=\")</code>（value 里可能有等号）。",
          ],
          solution: String.raw`import java.util.*;

public class Main {
    static Map<String, String> parseArgs(String[] args) {
        Map<String, String> result = new LinkedHashMap<>();
        if (args == null) return result;
        for (String arg : args) {
            if (arg == null || !arg.startsWith("--")) {
                throw new IllegalArgumentException("非法参数：" + arg);
            }
            int eq = arg.indexOf('=');
            if (eq < 0) throw new IllegalArgumentException("缺少等号：" + arg);
            String key = arg.substring(2, eq);
            String value = arg.substring(eq + 1);
            if (key.isBlank() || value.isBlank()) {
                throw new IllegalArgumentException("key/value 不能为空：" + arg);
            }
            result.put(key, value);
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(parseArgs(new String[]{"--name=java", "--level=21"}));
    }
}`,
          check: String.raw`        Map<String, String> m = Main.parseArgs(new String[]{"--name=java", "--level=21"});
        eq(m.get("name"), "java", "name 参数");
        eq(m.get("level"), "21", "level 参数");
        eq(m.size(), 2, "应解析出两个参数");
        check(Main.parseArgs(null).isEmpty(), "null 返回空 Map");
        String[] bad = {"name=java", "--name", "--=x", "--name="};
        for (String b : bad) {
            boolean thrown = false;
            try { Main.parseArgs(new String[]{b}); } catch (IllegalArgumentException e) { thrown = true; }
            check(thrown, "非法参数 [" + b + "] 应抛出 IllegalArgumentException");
        }`,
        },
        {
          id: "p13-4",
          kind: "quiz",
          question: "在 Maven 中，JUnit 依赖应该使用哪个 scope？",
          options: ["compile", "test", "provided", "runtime"],
          answer: 1,
          explain:
            "JUnit 只在编译和运行测试时需要，不应进入生产包。用 <code>&lt;scope&gt;test&lt;/scope&gt;</code>，它只在测试编译与测试运行阶段可见，打包时不会带上。",
        },
      ],
      further: [
        "《Java 核心技术 卷 II》第 2 章：输入与输出；第 9 章：安全（含构建与依赖基础）。",
        "《Effective Java 第 3 版》条目 55：明智地进行优化；条目 56：遵守普遍接受的命名惯例。",
        "《阿里巴巴 Java 开发手册》：工程结构、日志规约、单元测试规约。",
        "JUnit 5 官方用户指南（junit.org/junit5/docs/current/user-guide/）。",
      ],
    },

    /* ============================================================ 14 */
    {
      id: "architecture",
      title: "分层、SOLID 与可测试性",
      summary:
        "同样一个功能，有人写成 200 行 God Class，有人拆成可测试、可替换的几层。区别不在语法，而在依赖方向和职责边界。",
      level: "实战",
      minutes: 34,
      objectives: [
        "画出 controller → service → repository → domain 的依赖方向",
        "用 SOLID 原则识别“难改、难测”的代码",
        "用接口 + 依赖注入让核心逻辑不依赖外部资源",
        "用拓扑排序理解模块/任务之间的依赖关系",
      ],
      sections: [
        { type: "h", text: "分层：依赖只能向内" },
        {
          type: "code",
          file: "layers",
          lang: "text",
          plain: true,
          code: `controller（接收 HTTP / CLI 参数，做参数校验）
      ↓
service（用例编排：事务、权限、业务规则）
      ↓
repository（持久化接口；实现可以是 MySQL、Redis、文件）
      ↓
domain（实体、值对象、领域规则，不依赖任何框架）

依赖方向：外层依赖内层，内层不知道外层存在。`,
        },
        {
          type: "p",
          html: "最常见的坏味道是 domain 里出现 <code>HttpServletRequest</code>、<code>@Autowired</code>、SQL 字符串，或者 service 直接拼 JSON 返回给前端。领域层应该只表达业务，换 Web 框架、换数据库时不用改它。",
        },
        { type: "h", text: "SOLID 速记" },
        {
          type: "table",
          head: ["原则", "一句话", "违反时的症状"],
          rows: [
            ["S 单一职责", "一个类只做一件事", "类名带 And、God Class、改一处牵动多处"],
            ["O 开闭", "对扩展开放，对修改关闭", "每加一种支付方式就改一个巨大 switch"],
            ["L 里氏替换", "子类必须保持父类契约", "子类重写后调用方出现意外行为"],
            ["I 接口隔离", "接口小而专", "一个接口 20 个方法，实现类只用到 2 个"],
            ["D 依赖倒置", "依赖抽象，不依赖实现", "new 写死在业务代码里，测试必须连数据库"],
          ],
        },
        {
          type: "code",
          file: "RepositoryDemo.java",
          code: String.raw`import java.util.*;

interface OrderRepository {
    void save(String orderId);
    Optional<String> findById(String orderId);
}

class InMemoryOrderRepository implements OrderRepository {
    private final Map<String, String> store = new HashMap<>();

    @Override
    public void save(String orderId) {
        store.put(orderId, orderId);
    }

    @Override
    public Optional<String> findById(String orderId) {
        return Optional.ofNullable(store.get(orderId));
    }
}

class OrderService {
    private final OrderRepository repository;

    OrderService(OrderRepository repository) {   // 构造器注入：可替换、可测试
        this.repository = repository;
    }

    String detail(String orderId) {
        return repository.findById(orderId)
                .orElseThrow(() -> new NoSuchElementException("订单不存在：" + orderId));
    }
}`,
        },
        {
          type: "callout",
          tone: "deep",
          title: "依赖注入不是为了少写 new",
          html: "把 <code>OrderRepository</code> 作为接口传入，测试时可以传一个内存假实现，生产时传 MySQL 实现。核心业务逻辑因此<strong>不依赖数据库</strong>，测试既快又稳定。这才是 DI 的价值。",
        },
        { type: "h", text: "常用模式：先识别问题，再套模式" },
        {
          type: "list",
          items: [
            "<strong>策略</strong>：支付方式、折扣规则——用接口 + 多实现替代巨大 switch。",
            "<strong>工厂</strong>：对象创建逻辑复杂（多种参数组合）时，把 new 收进一个地方。",
            "<strong>仓储</strong>：把持久化细节隔离在接口后面，领域层只调用接口。",
            "<strong>建造者</strong>：参数很多且可选时，用链式 Builder 代替 8 个参数的构造器。",
            "<strong>责任链</strong>：审批、过滤器、拦截器——每个节点只处理自己能处理的。",
          ],
        },
        { type: "h", text: "可测试性是可维护性的先行指标" },
        {
          type: "list",
          items: [
            "纯函数（输入决定输出、无副作用）最容易测试，优先把业务规则抽成纯函数。",
            "时间、随机数、网络、文件系统都是外部依赖；通过参数注入 <code>Clock</code>、<code>Random</code>、接口。",
            "一个方法超过 30 行、参数超过 4 个，通常说明职责没拆干净。",
            "测试写不出来，往往不是测试的问题，而是设计耦合太重。",
          ],
        },
        { type: "h", text: "现代 Java 的架构表达力" },
        {
          type: "code",
          file: "OrderState.java",
          code: String.raw`sealed interface OrderState permits Created, Paid, Shipped, Cancelled {}
record Created(String orderId) implements OrderState {}
record Paid(String orderId, String transactionId) implements OrderState {}
record Shipped(String orderId, String trackingNo) implements OrderState {}
record Cancelled(String orderId, String reason) implements OrderState {}

public class OrderStateDemo {
    static String describe(OrderState state) {
        return switch (state) {
            case Created c -> "待支付：" + c.orderId();
            case Paid p -> "已支付：" + p.transactionId();
            case Shipped s -> "已发货：" + s.trackingNo();
            case Cancelled c -> "已取消：" + c.reason();
        };
    }

    public static void main(String[] args) {
        System.out.println(describe(new Paid("A1001", "T9001")));
    }
}`,
          output: "已支付：T9001",
        },
        {
          type: "p",
          html: "<code>sealed</code> + <code>record</code> + switch 模式匹配把“状态机”写成了类型系统的一部分：漏处理一个分支，编译器直接报错。Java 21 之前需要 default 分支，容易漏。",
        },
      ],
      exercises: [
        {
          id: "p14-1",
          kind: "code",
          title: "用 instanceof 分类值",
          difficulty: "★★☆",
          prompt:
            "实现 <code>describe(Object value)</code>：null 返回 <code>空值</code>，Integer 返回 <code>整数</code>，String 返回 <code>字符串</code>，List 返回 <code>集合</code>，其他返回 <code>其他</code>。使用 Java 16+ 的 instanceof 模式匹配。",
          starter: String.raw`import java.util.List;

public class Main {
    static String describe(Object value) {
        // TODO
        return "其他";
    }

    public static void main(String[] args) {
        System.out.println(describe(42));
        System.out.println(describe("java"));
        System.out.println(describe(List.of(1, 2)));
    }
}`,
          hints: [
            "<code>if (value instanceof Integer i)</code> 可以直接得到变量 i。",
            "顺序：先判 null，再判 Integer（注意 Long 不算 Integer）。",
          ],
          solution: String.raw`import java.util.List;

public class Main {
    static String describe(Object value) {
        if (value == null) return "空值";
        if (value instanceof Integer i) return "整数";
        if (value instanceof String s) return "字符串";
        if (value instanceof List<?> list) return "集合";
        return "其他";
    }

    public static void main(String[] args) {
        System.out.println(describe(42));
        System.out.println(describe("java"));
        System.out.println(describe(List.of(1, 2)));
    }
}`,
          check: String.raw`        eq(Main.describe(null), "空值", "null");
        eq(Main.describe(42), "整数", "Integer");
        eq(Main.describe("java"), "字符串", "String");
        eq(Main.describe(List.of(1, 2)), "集合", "List");
        eq(Main.describe(3.14), "其他", "Double 应为其他");
        eq(Main.describe(42L), "其他", "Long 不是 Integer");`,
        },
        {
          id: "p14-2",
          kind: "code",
          title: "可测试的校验器",
          difficulty: "★★★",
          prompt:
            "补全 <code>UserValidator</code>：实现 <code>Validator&lt;String&gt;</code> 的 <code>validate</code>，返回错误信息列表；合法用户名为空列表。规则：不能为 null 或空白（<code>用户名不能为空</code>）；长度 3~20（<code>用户名长度必须在 3~20 之间</code>）；不能包含空格（<code>用户名不能包含空格</code>）。多条错误要全部返回。",
          starter: String.raw`import java.util.*;

interface Validator<T> {
    List<String> validate(T value);
}

class UserValidator implements Validator<String> {
    @Override
    public List<String> validate(String value) {
        // TODO: 收集所有错误
        return List.of();
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new UserValidator().validate("ab"));
    }
}`,
          hints: [
            "用 <code>ArrayList&lt;String&gt;</code> 收集，不要遇到错误就 return。",
            "空值判断后可以提前返回“不能为空”，后续规则不再适用。",
          ],
          solution: String.raw`import java.util.*;

interface Validator<T> {
    List<String> validate(T value);
}

class UserValidator implements Validator<String> {
    @Override
    public List<String> validate(String value) {
        List<String> errors = new ArrayList<>();
        if (value == null || value.isBlank()) {
            errors.add("用户名不能为空");
            return errors;
        }
        if (value.length() < 3 || value.length() > 20) {
            errors.add("用户名长度必须在 3~20 之间");
        }
        if (value.contains(" ")) {
            errors.add("用户名不能包含空格");
        }
        return errors;
    }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new UserValidator().validate("ab"));
    }
}`,
          check: String.raw`        UserValidator v = new UserValidator();
        check(v.validate("java_dev").isEmpty(), "合法用户名应无错误");
        eq(v.validate(null), List.of("用户名不能为空"), "null 校验");
        eq(v.validate("   "), List.of("用户名不能为空"), "空白校验");
        eq(v.validate("ab"), List.of("用户名长度必须在 3~20 之间"), "长度不足");
        eq(v.validate("a".repeat(21)), List.of("用户名长度必须在 3~20 之间"), "长度超限");
        eq(v.validate("a "), List.of("用户名长度必须在 3~20 之间", "用户名不能包含空格"), "多条错误应全部返回");`,
        },
        {
          id: "p14-3",
          kind: "code",
          title: "拓扑排序：模块依赖顺序",
          difficulty: "★★★",
          prompt:
            "实现 <code>dependencyOrder(Map&lt;String, List&lt;String&gt;&gt; graph)</code>：返回一个构建顺序，保证每个模块都排在其依赖之后；有多个可选时按字典序（用优先队列）。若存在循环依赖抛出 <code>IllegalArgumentException</code>。",
          starter: String.raw`import java.util.*;

public class Main {
    static List<String> dependencyOrder(Map<String, List<String>> graph) {
        // TODO: Kahn 算法
        return List.of();
    }

    public static void main(String[] args) {
        Map<String, List<String>> g = new LinkedHashMap<>();
        g.put("app", List.of("service", "web"));
        g.put("service", List.of("core"));
        g.put("web", List.of("core"));
        g.put("core", List.of());
        System.out.println(dependencyOrder(g));
    }
}`,
          hints: [
            "入度 = 被多少模块依赖（反向边的数量）。先收集所有节点，包括只出现在依赖列表里的节点。",
            "Kahn：入度 0 入优先队列，弹出后把邻居入度减一，减到 0 再入队。",
            "若结果数量小于节点总数，说明有环，抛异常。",
          ],
          solution: String.raw`import java.util.*;

public class Main {
    static List<String> dependencyOrder(Map<String, List<String>> graph) {
        if (graph == null || graph.isEmpty()) return List.of();

        Map<String, Integer> indegree = new TreeMap<>();
        Map<String, List<String>> edges = new HashMap<>();
        for (String node : graph.keySet()) {
            indegree.putIfAbsent(node, 0);
            edges.putIfAbsent(node, new ArrayList<>());
        }
        for (Map.Entry<String, List<String>> e : graph.entrySet()) {
            for (String dep : e.getValue()) {
                indegree.putIfAbsent(dep, 0);
                edges.putIfAbsent(dep, new ArrayList<>());
                edges.get(dep).add(e.getKey());
                indegree.merge(e.getKey(), 1, Integer::sum);
            }
        }

        PriorityQueue<String> ready = new PriorityQueue<>();
        indegree.forEach((k, v) -> { if (v == 0) ready.add(k); });

        List<String> order = new ArrayList<>();
        while (!ready.isEmpty()) {
            String node = ready.poll();
            order.add(node);
            for (String next : edges.getOrDefault(node, List.of())) {
                int left = indegree.merge(next, -1, Integer::sum);
                if (left == 0) ready.add(next);
            }
        }
        if (order.size() != indegree.size()) {
            throw new IllegalArgumentException("存在循环依赖");
        }
        return order;
    }

    public static void main(String[] args) {
        Map<String, List<String>> g = new LinkedHashMap<>();
        g.put("app", List.of("service", "web"));
        g.put("service", List.of("core"));
        g.put("web", List.of("core"));
        g.put("core", List.of());
        System.out.println(dependencyOrder(g));
    }
}`,
          check: String.raw`        Map<String, List<String>> g = new LinkedHashMap<>();
        g.put("app", List.of("service", "web"));
        g.put("service", List.of("core"));
        g.put("web", List.of("core"));
        g.put("core", List.of());
        eq(Main.dependencyOrder(g), List.of("core", "service", "web", "app"), "同层按字典序：service 在 web 前");

        Map<String, List<String>> single = Map.of("a", List.of());
        eq(Main.dependencyOrder(single), List.of("a"), "单节点");

        Map<String, List<String>> cycle = new LinkedHashMap<>();
        cycle.put("a", List.of("b"));
        cycle.put("b", List.of("a"));
        boolean thrown = false;
        try { Main.dependencyOrder(cycle); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "循环依赖应抛出 IllegalArgumentException");
        eq(Main.dependencyOrder(null), List.of(), "null 返回空列表");`,
        },
        {
          id: "p14-4",
          kind: "quiz",
          question: "在分层架构中，下面哪种依赖方向是正确的？",
          options: [
            "domain 直接依赖 repository 的 MySQL 实现",
            "controller 直接写 SQL 查询数据库",
            "service 依赖 repository 接口，repository 实现依赖 domain",
            "domain 依赖 controller 获取请求参数",
          ],
          answer: 2,
          explain:
            "依赖应该指向更稳定的内层。service 面向 repository 接口编程，具体实现（MySQL、Redis、内存）是可替换的外层细节；domain 保持独立，不被框架和存储污染。",
        },
      ],
      further: [
        "《架构整洁之道》第 3 部分：设计原则（SOLID）与第 5 部分：软件架构。",
        "《领域驱动设计》第 1–4 章：领域模型、通用语言、分层架构。",
        "《Effective Java 第 3 版》条目 1：考虑用静态工厂方法代替构造器；条目 2：遇到多个构造器参数时考虑使用构造器（Builder）。",
        "GitHub: iluwatar/java-design-patterns —— 策略、工厂、仓储、责任链的 Java 实现。",
      ],
    },
  ],
});
