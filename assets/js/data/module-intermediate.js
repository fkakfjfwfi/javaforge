/* 模块 02 · 面向对象与核心类库
   类与对象、继承与接口、集合、异常。四节覆盖日常 Java 代码 80% 的结构。 */
window.CURRICULUM = window.CURRICULUM || { modules: [] };
window.CURRICULUM.modules.push({
  id: "intermediate",
  index: "02",
  title: "面向对象与核心类库",
  tagline: "从“会写方法”到“会设计类”",
  description:
    "Java 的工程能力大半建立在四个东西上：封装良好的类、清晰的多态边界、选对的集合、处理得体的异常。每节都从一个真实的设计问题出发，而不是背概念。",
  accent: "#6b4bc4",
  lessons: [
    /* ============================================================ 05 */
    {
      id: "classes",
      title: "类、封装与对象生命周期",
      summary:
        "类不是“把字段和方法堆在一起”，而是维护不变量的边界。封装、构造器、static、初始化顺序，决定了你的对象从创建到销毁是否可控。",
      level: "中级核心",
      minutes: 30,
      objectives: [
        "用私有字段 + 公共方法维护对象的不变量",
        "写出安全的构造器，理解 this 与构造器重载",
        "区分实例成员与 static 成员，避免在 static 上下文访问实例状态",
        "说清 Java 对象的初始化顺序",
      ],
      sections: [
        { type: "h", text: "类是一组不变量，不是字段清单" },
        {
          type: "p",
          html: "一个设计良好的类，会保证“任何时刻对象都处于合法状态”。余额不能为负、任务标题不能为空、开始时间不能晚于结束时间——这些规则应该由类自己守住，而不是靠调用方自觉。",
        },
        {
          type: "code",
          file: "Account.java",
          code: String.raw`public class Account {
    private int balance;          // 私有：外部不能直接改

    public Account(int initialBalance) {
        if (initialBalance < 0) {
            throw new IllegalArgumentException("初始余额不能为负");
        }
        this.balance = initialBalance;
    }

    public int getBalance() {
        return balance;
    }

    public void deposit(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("存款必须大于 0");
        }
        balance += amount;
    }

    public void withdraw(int amount) {
        if (amount <= 0) {
            throw new IllegalArgumentException("取款必须大于 0");
        }
        if (amount > balance) {
            throw new IllegalArgumentException("余额不足");
        }
        balance -= amount;
    }
}`,
        },
        {
          type: "callout",
          tone: "deep",
          title: "为什么字段要 private",
          html: "一旦字段公开，任何代码都能把它改成非法值，类就无法再保证自己的不变量。封装不是为了“藏起来”，而是为了<strong>让所有修改都经过校验</strong>。需要暴露状态时提供只读的 getter，需要修改时提供带校验的方法。",
        },
        { type: "h", text: "构造器、this 与重载" },
        {
          type: "code",
          file: "Task.java",
          code: String.raw`public class Task {
    private final String title;
    private final int priority;

    public Task(String title) {
        this(title, 3);              // 调用另一个构造器，必须放在第一行
    }

    public Task(String title, int priority) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("标题不能为空");
        }
        this.title = title;
        this.priority = priority;
    }

    public String getTitle() { return title; }
    public int getPriority() { return priority; }
}`,
        },
        {
          type: "list",
          items: [
            "<code>this(...)</code> 只能在构造器里调用，且必须是第一条语句。",
            "<code>final</code> 字段必须在构造器结束前赋值，之后不能再改。",
            "参数校验放在构造器里，非法对象根本创建不出来。",
            "不要写 <code>public void setBalance(...)</code> 直接赋值；setter 也要校验。",
          ],
        },
        { type: "h", text: "static：属于类，不属于对象" },
        {
          type: "code",
          file: "IdGenerator.java",
          code: String.raw`public class IdGenerator {
    private static int counter = 0;

    public static int next() {
        counter++;
        return counter;
    }

    public static void main(String[] args) {
        System.out.println(IdGenerator.next());
        System.out.println(IdGenerator.next());
    }
}`,
          output: "1\n2",
        },
        {
          type: "callout",
          tone: "warn",
          title: "static 方法里没有 this",
          html: "<code>static</code> 方法属于类，不能直接访问实例字段或实例方法。工具方法（<code>Math.max</code>、<code>Arrays.sort</code>）是 static 的典型用法；状态计数、缓存这类共享数据要特别小心线程安全。",
        },
        { type: "h", text: "初始化顺序：记住这条链" },
        {
          type: "list",
          items: [
            "父类 static 字段 / static 块 → 子类 static 字段 / static 块",
            "父类实例字段 / 实例初始化块 → 父类构造器",
            "子类实例字段 / 实例初始化块 → 子类构造器",
            "所有 static 初始化只执行一次，在类第一次被使用时触发。",
          ],
        },
        {
          type: "code",
          file: "InitOrder.java",
          code: String.raw`public class InitOrder {
    static { System.out.println("1. static 块"); }
    private String field = init("2. 实例字段");

    { System.out.println("3. 实例初始化块"); }

    InitOrder() {
        System.out.println("4. 构造器");
    }

    static String init(String s) {
        System.out.println(s);
        return s;
    }

    public static void main(String[] args) {
        new InitOrder();
    }
}`,
          output: "1. static 块\n2. 实例字段\n3. 实例初始化块\n4. 构造器",
        },
        { type: "h", text: "访问修饰符与包" },
        {
          type: "table",
          head: ["修饰符", "同类", "同包", "子类", "任何位置"],
          rows: [
            ["private", "✓", "—", "—", "—"],
            ["（默认）package-private", "✓", "✓", "—", "—"],
            ["protected", "✓", "✓", "✓", "—"],
            ["public", "✓", "✓", "✓", "✓"],
          ],
        },
        {
          type: "p",
          html: "包（package）既是命名空间，也是访问边界。真实项目按业务分层：<code>com.example.order.domain</code> 放实体，<code>...repository</code> 放持久化，<code>...service</code> 放用例。不要把所有类都塞进默认包。",
        },
      ],
      exercises: [
        {
          id: "m5-1",
          kind: "code",
          title: "给账户加上校验",
          difficulty: "★★☆",
          prompt:
            "补全 <code>Account</code>：构造器拒绝负的初始余额；<code>deposit</code> 拒绝非正数；<code>withdraw</code> 拒绝非正数或余额不足。非法操作统一抛出 <code>IllegalArgumentException</code>。",
          starter: String.raw`class Account {
    private int balance;

    Account(int initialBalance) {
        // TODO: 校验后赋值
        this.balance = initialBalance;
    }

    int getBalance() {
        return balance;
    }

    void deposit(int amount) {
        // TODO: 校验 amount > 0
        balance += amount;
    }

    void withdraw(int amount) {
        // TODO: 校验 amount > 0 且不超过余额
        balance -= amount;
    }
}

public class Main {
    public static void main(String[] args) {
        Account a = new Account(100);
        a.deposit(50);
        a.withdraw(30);
        System.out.println(a.getBalance());
    }
}`,
          hints: [
            "三个校验都用 <code>if (...) throw new IllegalArgumentException(\"...\")</code>。",
            "取款要先判断金额合法，再判断余额是否足够。",
          ],
          solution: String.raw`class Account {
    private int balance;

    Account(int initialBalance) {
        if (initialBalance < 0) throw new IllegalArgumentException("初始余额不能为负");
        this.balance = initialBalance;
    }

    int getBalance() {
        return balance;
    }

    void deposit(int amount) {
        if (amount <= 0) throw new IllegalArgumentException("存款必须大于 0");
        balance += amount;
    }

    void withdraw(int amount) {
        if (amount <= 0) throw new IllegalArgumentException("取款必须大于 0");
        if (amount > balance) throw new IllegalArgumentException("余额不足");
        balance -= amount;
    }
}

public class Main {
    public static void main(String[] args) {
        Account a = new Account(100);
        a.deposit(50);
        a.withdraw(30);
        System.out.println(a.getBalance());
    }
}`,
          check: String.raw`        Account a = new Account(100);
        a.deposit(50);
        a.withdraw(30);
        eq(a.getBalance(), 120, "100 + 50 - 30 = 120");
        boolean thrown = false;
        try { a.withdraw(500); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "余额不足应抛出 IllegalArgumentException");
        thrown = false;
        try { a.deposit(-10); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "存款为非正数应抛出异常");
        thrown = false;
        try { new Account(-1); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "负的初始余额应抛出异常");`,
        },
        {
          id: "m5-2",
          kind: "code",
          title: "构造器重载与默认值",
          difficulty: "★★☆",
          prompt:
            "补全 <code>Task</code>：单参数构造器把优先级设为 3；双参数构造器校验标题非空、优先级在 1~5 之间，否则抛 <code>IllegalArgumentException</code>。",
          starter: String.raw`class Task {
    private final String title;
    private final int priority;

    Task(String title) {
        // TODO: 调用双参数构造器，默认优先级 3
        this.title = title;
        this.priority = 3;
    }

    Task(String title, int priority) {
        // TODO: 校验后赋值
        this.title = title;
        this.priority = priority;
    }

    String getTitle() { return title; }
    int getPriority() { return priority; }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Task("复习集合").getPriority());
        System.out.println(new Task("修复线上问题", 1).getPriority());
    }
}`,
          hints: [
            "<code>this(title, 3)</code> 必须写在构造器第一行。",
            "标题校验：<code>title == null || title.isBlank()</code>。",
          ],
          solution: String.raw`class Task {
    private final String title;
    private final int priority;

    Task(String title) {
        this(title, 3);
    }

    Task(String title, int priority) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("标题不能为空");
        if (priority < 1 || priority > 5) throw new IllegalArgumentException("优先级必须在 1~5");
        this.title = title;
        this.priority = priority;
    }

    String getTitle() { return title; }
    int getPriority() { return priority; }
}

public class Main {
    public static void main(String[] args) {
        System.out.println(new Task("复习集合").getPriority());
        System.out.println(new Task("修复线上问题", 1).getPriority());
    }
}`,
          check: String.raw`        eq(new Task("复习集合").getPriority(), 3, "单参数构造器默认优先级应为 3");
        eq(new Task("复习集合").getTitle(), "复习集合", "标题应正确保存");
        eq(new Task("上线", 5).getPriority(), 5, "自定义优先级应生效");
        boolean thrown = false;
        try { new Task(" ", 2); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "空白标题应抛出异常");
        thrown = false;
        try { new Task("合法标题", 9); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "越界优先级应抛出异常");`,
        },
        {
          id: "m5-3",
          kind: "code",
          title: "static 计数器",
          difficulty: "★★☆",
          prompt:
            "补全 <code>Counter</code>：每次 <code>new Counter()</code> 让静态计数加一；<code>createdCount()</code> 返回累计创建数量；<code>reset()</code> 归零。",
          starter: String.raw`class Counter {
    private static int created;

    Counter() {
        // TODO: 计数加一
    }

    static int createdCount() {
        // TODO
        return 0;
    }

    static void reset() {
        // TODO
    }
}

public class Main {
    public static void main(String[] args) {
        new Counter();
        new Counter();
        System.out.println(Counter.createdCount());
    }
}`,
          hints: [
            "static 字段属于类，所有实例共享。",
            "<code>createdCount()</code> 是 static 方法，直接返回 <code>created</code>。",
          ],
          solution: String.raw`class Counter {
    private static int created;

    Counter() {
        created++;
    }

    static int createdCount() {
        return created;
    }

    static void reset() {
        created = 0;
    }
}

public class Main {
    public static void main(String[] args) {
        new Counter();
        new Counter();
        System.out.println(Counter.createdCount());
    }
}`,
          check: String.raw`        Counter.reset();
        new Counter();
        new Counter();
        new Counter();
        eq(Counter.createdCount(), 3, "创建 3 个实例后计数应为 3");
        Counter.reset();
        eq(Counter.createdCount(), 0, "reset 后应归零");
        new Counter();
        eq(Counter.createdCount(), 1, "归零后再创建应为 1");`,
        },
        {
          id: "m5-4",
          kind: "quiz",
          question: "关于 <code>static</code> 方法，下面哪句是正确的？",
          options: [
            "static 方法可以直接访问同类中的实例字段",
            "static 方法可以通过 this 访问当前对象",
            "static 方法属于类，可以直接通过类名调用，不能访问实例成员",
            "static 方法不能被重载",
          ],
          answer: 2,
          explain:
            "<code>static</code> 方法属于类，没有隐式的 <code>this</code>，因此不能直接访问实例字段或实例方法。它可以被重载（同名不同参数），也可以通过对象引用调用（但不推荐）。",
        },
      ],
      further: [
        "《Java 核心技术 卷 I》第 4 章：对象与类 —— 构造器、封装、static、初始化。",
        "《Effective Java 第 3 版》条目 15：使类和成员的可访问性最小化；条目 17：使可变性最小化。",
        "《阿里巴巴 Java 开发手册》：POJO 规约、构造器与 setter 的使用边界。",
      ],
    },

    /* ============================================================ 06 */
    {
      id: "inheritance",
      title: "继承、接口与多态",
      summary:
        "继承不是“代码复用工具”，而是“类型关系声明”。什么时候用接口、什么时候用抽象类、什么时候干脆组合，决定了你的代码会不会越改越乱。",
      level: "中级核心",
      minutes: 32,
      objectives: [
        "正确使用 extends / super 与 @Override，理解动态分派",
        "区分抽象类与接口的适用场景",
        "用 record 写不可变数据载体",
        "用组合替代不必要的继承，理解 sealed 类型的意义",
      ],
      sections: [
        { type: "h", text: "继承：声明 is-a 关系" },
        {
          type: "code",
          file: "ShapeDemo.java",
          code: String.raw`abstract class Shape {
    abstract double area();

    @Override
    public String toString() {
        return getClass().getSimpleName() + "(" + area() + ")";
    }
}

class Circle extends Shape {
    private final double radius;

    Circle(double radius) { this.radius = radius; }

    @Override
    double area() { return Math.PI * radius * radius; }
}

class Rect extends Shape {
    private final double width, height;

    Rect(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    double area() { return width * height; }
}

public class ShapeDemo {
    public static void main(String[] args) {
        Shape shape = new Rect(3, 4);
        System.out.println(shape.area());   // 多态：运行时决定调用哪个 area
    }
}`,
          output: "12.0",
        },
        {
          type: "callout",
          tone: "deep",
          title: "多态发生在运行时",
          html: "编译期只看引用类型（<code>Shape</code> 有 <code>area()</code>），运行期按实际对象类型（<code>Rect</code>）分派。<code>@Override</code> 不是装饰，它让编译器帮你检查“确实重写了父类方法”，参数写错时会直接报错。",
        },
        { type: "h", text: "抽象类 vs 接口" },
        {
          type: "table",
          head: ["对比项", "抽象类 abstract class", "接口 interface"],
          rows: [
            ["能否有实现", "可以有完整方法、字段、构造器", "默认方法 / static 方法可以有实现"],
            ["能否被继承多个", "不能，单继承", "可以，多实现"],
            ["适合表达", "同一族对象的共同骨架", "一组能力契约"],
            ["典型例子", "Shape、Repository 基类", "Comparable、Runnable、Discount"],
          ],
        },
        {
          type: "code",
          file: "DiscountDemo.java",
          code: String.raw`interface Discount {
    double apply(double price);

    default String describe() {
        return "折扣策略：" + getClass().getSimpleName();
    }
}

class PercentDiscount implements Discount {
    private final double percent;

    PercentDiscount(double percent) { this.percent = percent; }

    @Override
    public double apply(double price) {
        return price * (1 - percent / 100);
    }
}

public class DiscountDemo {
    public static void main(String[] args) {
        Discount d = new PercentDiscount(20);
        System.out.println(d.apply(100));   // 80.0
        System.out.println(d.describe());
    }
}`,
          output: "80.0\n折扣策略：PercentDiscount",
        },
        { type: "h", text: "record：数据载体的正确姿势" },
        {
          type: "code",
          file: "PointDemo.java",
          code: String.raw`record Point(int x, int y) {
    Point translate(int dx, int dy) {
        return new Point(x + dx, y + dy);
    }
}

public class PointDemo {
    public static void main(String[] args) {
        Point p = new Point(1, 2);
        System.out.println(p.x() + "," + p.y());
        System.out.println(p.translate(3, 4));
        System.out.println(new Point(1, 2).equals(p));  // true
    }
}`,
          output: "1,2\nPoint[x=4, y=6]\ntrue",
        },
        {
          type: "list",
          items: [
            "record 自动生成私有 final 字段、全参构造器、访问器、equals、hashCode、toString。",
            "访问器叫 <code>x()</code>，不是 <code>getX()</code>。",
            "record 适合 DTO、值对象、方法返回的复合结果；不适合需要可变状态或复杂继承的实体。",
            "可以在 record 里写紧凑构造器做校验：<code>record Range(int lo, int hi) { Range { if (lo > hi) throw ...; } }</code>。",
          ],
        },
        { type: "h", text: "组合优于继承" },
        {
          type: "code",
          file: "Composition.java",
          code: String.raw`import java.util.ArrayList;
import java.util.List;

class Order {
    private final List<String> items = new ArrayList<>();

    void add(String item) { items.add(item); }
    int size() { return items.size(); }
    List<String> items() { return List.copyOf(items); }  // 防御性拷贝
}

public class Composition {
    public static void main(String[] args) {
        Order order = new Order();
        order.add("键盘");
        System.out.println(order.size());
        System.out.println(order.items());
    }
}`,
          output: "1\n[键盘]",
        },
        {
          type: "p",
          html: "继承会把你和父类的实现细节永久绑定：父类改一个方法，子类可能悄悄坏掉。如果只是“需要某些能力”，优先组合——在自己的类里持有一个对象，只暴露你需要的方法。",
        },
        { type: "h", text: "sealed：限制谁能继承" },
        {
          type: "code",
          file: "SealedDemo.java",
          code: String.raw`sealed interface Payment permits CardPayment, CashPayment {}
record CardPayment(String cardNo) implements Payment {}
record CashPayment(double received) implements Payment {}

public class SealedDemo {
    public static void main(String[] args) {
        Payment p = new CashPayment(100);
        System.out.println(p);
    }
}`,
          output: "CashPayment[received=100.0]",
        },
        {
          type: "p",
          html: "<code>sealed</code> 把子类名单写进类型本身，配合 switch 的模式匹配可以让编译器检查“是否处理了所有情况”。适合表达封闭的业务分支，比如支付方式、订单状态。",
        },
      ],
      exercises: [
        {
          id: "m6-1",
          kind: "code",
          title: "实现折扣接口",
          difficulty: "★★☆",
          prompt:
            "补全 <code>PercentDiscount</code>：实现 <code>Discount</code> 的 <code>apply</code>，返回打折后的价格。百分比为 20 表示打八折；百分比必须在 0~100 之间，否则构造器抛 <code>IllegalArgumentException</code>。",
          starter: String.raw`interface Discount {
    double apply(double price);
}

class PercentDiscount implements Discount {
    private final double percent;

    PercentDiscount(double percent) {
        // TODO: 校验范围
        this.percent = percent;
    }

    @Override
    public double apply(double price) {
        // TODO
        return price;
    }
}

public class Main {
    public static void main(String[] args) {
        Discount d = new PercentDiscount(20);
        System.out.println(d.apply(100));
    }
}`,
          hints: [
            "<code>price * (1 - percent / 100)</code>。",
            "校验：<code>percent &lt; 0 || percent &gt; 100</code>。",
          ],
          solution: String.raw`interface Discount {
    double apply(double price);
}

class PercentDiscount implements Discount {
    private final double percent;

    PercentDiscount(double percent) {
        if (percent < 0 || percent > 100) throw new IllegalArgumentException("折扣必须在 0~100");
        this.percent = percent;
    }

    @Override
    public double apply(double price) {
        return price * (1 - percent / 100);
    }
}

public class Main {
    public static void main(String[] args) {
        Discount d = new PercentDiscount(20);
        System.out.println(d.apply(100));
    }
}`,
          check: String.raw`        near(new PercentDiscount(20).apply(100), 80.0, 0.0001, "八折应为 80");
        near(new PercentDiscount(0).apply(50), 50.0, 0.0001, "0% 折扣不变");
        near(new PercentDiscount(100).apply(50), 0.0, 0.0001, "100% 折扣为 0");
        boolean thrown = false;
        try { new PercentDiscount(120); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "超过 100 的折扣应抛出异常");`,
        },
        {
          id: "m6-2",
          kind: "code",
          title: "抽象类与多态",
          difficulty: "★★★",
          prompt:
            "补全 <code>Circle</code> 和 <code>Rect</code> 的 <code>area()</code>：圆面积 πr²，矩形面积宽×高。<code>Shape</code> 已声明抽象方法，判题会用 <code>Shape</code> 引用调用。",
          starter: String.raw`abstract class Shape {
    abstract double area();
}

class Circle extends Shape {
    private final double radius;

    Circle(double radius) { this.radius = radius; }

    @Override
    double area() {
        return 0;   // TODO: πr²
    }
}

class Rect extends Shape {
    private final double width, height;

    Rect(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    double area() {
        return 0;   // TODO: 宽 × 高
    }
}

public class Main {
    public static void main(String[] args) {
        Shape s = new Rect(3, 4);
        System.out.println(s.area());
    }
}`,
          hints: [
            "抽象方法没有方法体：<code>abstract double area();</code>。",
            "子类重写时加 <code>@Override</code>，返回类型保持一致。",
          ],
          solution: String.raw`abstract class Shape {
    abstract double area();
}

class Circle extends Shape {
    private final double radius;

    Circle(double radius) { this.radius = radius; }

    @Override
    double area() {
        return Math.PI * radius * radius;
    }
}

class Rect extends Shape {
    private final double width, height;

    Rect(double width, double height) {
        this.width = width;
        this.height = height;
    }

    @Override
    double area() {
        return width * height;
    }
}

public class Main {
    public static void main(String[] args) {
        Shape s = new Rect(3, 4);
        System.out.println(s.area());
    }
}`,
          check: String.raw`        near(new Rect(3, 4).area(), 12.0, 0.0001, "矩形面积");
        near(new Circle(2).area(), Math.PI * 4, 0.0001, "圆面积 πr²");
        Shape s = new Circle(1);
        near(s.area(), Math.PI, 0.0001, "通过 Shape 引用调用应触发多态");
        check(s instanceof Circle, "Shape 引用应指向 Circle 实例");`,
        },
        {
          id: "m6-3",
          kind: "code",
          title: "record 值对象",
          difficulty: "★★☆",
          prompt:
            "补全 <code>record Point(int x, int y)</code>，并添加 <code>translate(int dx, int dy)</code> 方法返回平移后的新点。<code>equals</code>、<code>toString</code>、访问器都由 record 自动生成。",
          starter: String.raw`record Point(int x, int y) {
    Point translate(int dx, int dy) {
        return this;   // TODO: 返回平移后的新点
    }
}

public class Main {
    public static void main(String[] args) {
        Point p = new Point(1, 2);
        System.out.println(p.translate(3, 4));
    }
}`,
          hints: [
            "record 的字段访问器是 <code>x()</code> 和 <code>y()</code>。",
            "返回 <code>new Point(x + dx, y + dy)</code>，不要修改字段（record 字段是 final）。",
          ],
          solution: String.raw`record Point(int x, int y) {
    Point translate(int dx, int dy) {
        return new Point(x + dx, y + dy);
    }
}

public class Main {
    public static void main(String[] args) {
        Point p = new Point(1, 2);
        System.out.println(p.translate(3, 4));
    }
}`,
          check: String.raw`        eq(new Point(1, 2).translate(3, 4), new Point(4, 6), "平移结果不对");
        eq(new Point(0, 0).translate(-1, -1), new Point(-1, -1), "负方向平移");
        eq(new Point(1, 2).x(), 1, "访问器 x() 应可用");
        eq(new Point(1, 2).toString(), "Point[x=1, y=2]", "record 的 toString 格式");`,
        },
        {
          id: "m6-4",
          kind: "quiz",
          question: "下面关于“重载（overload）”与“重写（override）”的说法，哪句正确？",
          options: [
            "重载发生在父子类之间，重写发生在同一个类里",
            "重载看参数列表，重写看方法签名且发生在父子类之间",
            "重载和重写都只要求方法名相同",
            "重写可以改变参数列表，重载不能",
          ],
          answer: 1,
          explain:
            "重载是同一个类中同名、参数列表不同的多个方法，编译期解析；重写是子类覆盖父类同名同参数的方法，运行期动态分派。<code>@Override</code> 可以帮你确认自己写的是重写。",
        },
      ],
      further: [
        "《Java 核心技术 卷 I》第 5 章：继承 —— 多态、抽象类、接口。",
        "《Effective Java 第 3 版》条目 18：组合优先于继承；条目 20：接口优先于类。",
        "《Java 核心技术 卷 I》第 6 章：接口、lambda 与内部类。",
      ],
    },

    /* ============================================================ 07 */
    {
      id: "collections",
      title: "集合框架：选对容器比背 API 重要",
      summary:
        "ArrayList、HashMap、TreeSet 不是同一种东西的不同写法。它们的底层结构决定了时间复杂度、顺序、去重行为和线程安全性。",
      level: "中级核心",
      minutes: 34,
      objectives: [
        "根据读写模式选择 List / Set / Map 的具体实现",
        "理解 ArrayList 扩容与 HashMap 的哈希定位",
        "正确实现 equals / hashCode，让对象能作为 Map 的 key",
        "用 Comparator、merge、removeIf 简化集合操作",
      ],
      sections: [
        { type: "h", text: "一张图记住集合家族" },
        {
          type: "table",
          head: ["接口", "常用实现", "顺序", "去重", "典型用途"],
          rows: [
            ["List", "ArrayList / LinkedList", "按插入顺序", "否", "列表、栈、队列（ArrayList 为主）"],
            ["Set", "HashSet / LinkedHashSet / TreeSet", "HashSet 无序，Linked 插入序，Tree 排序", "是", "去重、集合运算"],
            ["Map", "HashMap / LinkedHashMap / TreeMap", "Hash 无序，Linked 插入序，Tree 键排序", "键唯一", "计数、索引、缓存"],
            ["Deque", "ArrayDeque", "双端", "否", "栈 / 队列，优先于 Stack / LinkedList"],
          ],
        },
        { type: "h", text: "ArrayList vs LinkedList：别凭感觉选" },
        {
          type: "list",
          items: [
            "ArrayList 底层是数组，随机访问 O(1)，尾部追加摊还 O(1)，中间插入/删除 O(n)。",
            "LinkedList 底层是双向链表，按下标访问 O(n)，已知节点插入/删除 O(1)，但节点对象开销大。",
            "90% 的业务场景用 ArrayList。需要队列用 ArrayDeque；只有在大量已知位置的插入删除时才考虑 LinkedList。",
            "ArrayList 默认容量 10，扩容约 1.5 倍；能预估大小时用 <code>new ArrayList<>(size)</code> 减少拷贝。",
          ],
        },
        {
          type: "code",
          file: "ListDemo.java",
          code: String.raw`import java.util.ArrayList;
import java.util.List;

public class ListDemo {
    public static void main(String[] args) {
        List<String> names = new ArrayList<>();
        names.add("林");
        names.add("陈");
        names.add(0, "周");          // 中间插入，后面的元素整体后移

        System.out.println(names);
        System.out.println(names.get(1));
        System.out.println(names.size());

        names.remove("陈");          // 按对象删除
        names.remove(0);             // 按下标删除
        System.out.println(names);
    }
}`,
          output: "[周, 林, 陈]\n林\n3\n[林]",
        },
        {
          type: "callout",
          tone: "warn",
          title: "remove(int) 还是 remove(Object)",
          html: "对 <code>List&lt;Integer&gt;</code> 调用 <code>remove(1)</code> 删除的是<strong>下标 1</strong>，不是值为 1 的元素。要按值删，用 <code>remove(Integer.valueOf(1))</code>。这是自动装箱最坑的地方之一。",
        },
        { type: "h", text: "Set：去重与顺序" },
        {
          type: "code",
          file: "SetDemo.java",
          code: String.raw`import java.util.LinkedHashSet;
import java.util.List;
import java.util.Set;
import java.util.TreeSet;

public class SetDemo {
    public static void main(String[] args) {
        Set<String> hash = new java.util.HashSet<>(List.of("b", "a", "c", "a"));
        Set<String> linked = new LinkedHashSet<>(List.of("b", "a", "c", "a"));
        Set<String> tree = new TreeSet<>(List.of("b", "a", "c", "a"));

        System.out.println(hash);    // 顺序不保证
        System.out.println(linked);  // 按插入顺序
        System.out.println(tree);    // 按字典序
    }
}`,
          output: "[a, b, c]\n[b, a, c]\n[a, b, c]",
        },
        { type: "h", text: "Map：计数、分组、索引" },
        {
          type: "code",
          file: "MapDemo.java",
          code: String.raw`import java.util.HashMap;
import java.util.Map;

public class MapDemo {
    public static void main(String[] args) {
        Map<String, Integer> counts = new HashMap<>();
        String text = "java stream java lambda";

        for (String word : text.split(" ")) {
            counts.merge(word, 1, Integer::sum);   // 比 get + null 判断安全
        }

        System.out.println(counts.get("java"));
        System.out.println(counts.getOrDefault("python", 0));
        System.out.println(counts.containsKey("stream"));

        for (Map.Entry<String, Integer> e : counts.entrySet()) {
            System.out.println(e.getKey() + "=" + e.getValue());
        }
    }
}`,
          output: "2\n0\ntrue\njava=2\nstream=1\nlambda=1",
        },
        {
          type: "callout",
          tone: "deep",
          title: "HashMap 为什么能 O(1)",
          html: "先用 <code>hashCode()</code> 定位桶，再用 <code>equals()</code> 在桶内比较。Java 8 之后桶内元素超过阈值会从链表转红黑树（O(log n)）。如果两个方法实现不一致，就会出现“存进去却 get 不到”的诡异问题。",
        },
        { type: "h", text: "equals 与 hashCode 的契约" },
        {
          type: "code",
          file: "StudentKey.java",
          code: String.raw`import java.util.Objects;

class StudentKey {
    private final String id;
    private final String name;

    StudentKey(String id, String name) {
        this.id = id;
        this.name = name;
    }

    @Override
    public boolean equals(Object o) {
        if (this == o) return true;
        if (!(o instanceof StudentKey other)) return false;
        return Objects.equals(id, other.id) && Objects.equals(name, other.name);
    }

    @Override
    public int hashCode() {
        return Objects.hash(id, name);
    }
}`,
        },
        {
          type: "list",
          items: [
            "equals 返回 true 的两个对象，hashCode 必须相同。",
            "hashCode 相同的两个对象，equals 不一定为 true（哈希碰撞）。",
            "参与 equals 的字段必须参与 hashCode，且不能是可变字段。",
            "最简单的正确做法：用 record，或者 IDE 生成 + <code>Objects.hash</code>。",
          ],
        },
        { type: "h", text: "排序与遍历删除" },
        {
          type: "code",
          file: "SortDemo.java",
          code: String.raw`import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

record Student(String name, int score) {}

public class SortDemo {
    public static void main(String[] args) {
        List<Student> list = new ArrayList<>(List.of(
            new Student("林", 88), new Student("陈", 95), new Student("周", 88)
        ));

        list.sort(Comparator.comparingInt(Student::score).reversed()
                .thenComparing(Student::name));

        System.out.println(list);

        list.removeIf(s -> s.score() < 90);   // 安全地按条件删除
        System.out.println(list);
    }
}`,
          output: "[Student[name=陈, score=95], Student[name=周, score=88], Student[name=林, score=88]]\n[Student[name=陈, score=95]]",
        },
        {
          type: "p",
          html: "遍历时删除元素的正确方式：<code>Iterator.remove()</code> 或 <code>removeIf</code>。直接 <code>list.remove()</code> 会抛 <code>ConcurrentModificationException</code>，因为迭代器检测到结构性修改。",
        },
      ],
      exercises: [
        {
          id: "m7-1",
          kind: "code",
          title: "词频统计",
          difficulty: "★★☆",
          prompt:
            "实现 <code>wordCount(String text)</code>，按空格切分，统计每个单词出现次数，返回 <code>Map&lt;String, Integer&gt;</code>。空字符串或 null 返回空 Map；忽略大小写。",
          starter: String.raw`import java.util.*;

public class Main {
    static Map<String, Integer> wordCount(String text) {
        Map<String, Integer> counts = new HashMap<>();
        // TODO: toLowerCase、split、merge
        return counts;
    }

    public static void main(String[] args) {
        System.out.println(wordCount("Java stream java lambda"));
    }
}`,
          hints: [
            "<code>text.toLowerCase().split(\" \")</code>，注意先判空。",
            "<code>counts.merge(word, 1, Integer::sum)</code>。",
          ],
          solution: String.raw`import java.util.*;

public class Main {
    static Map<String, Integer> wordCount(String text) {
        Map<String, Integer> counts = new HashMap<>();
        if (text == null || text.isBlank()) return counts;
        for (String word : text.toLowerCase().split(" ")) {
            if (!word.isBlank()) counts.merge(word, 1, Integer::sum);
        }
        return counts;
    }

    public static void main(String[] args) {
        System.out.println(wordCount("Java stream java lambda"));
    }
}`,
          check: String.raw`        Map<String, Integer> m = Main.wordCount("Java stream java lambda");
        eq(m.get("java"), 2, "java 出现 2 次（忽略大小写）");
        eq(m.get("stream"), 1, "stream 出现 1 次");
        eq(m.size(), 3, "应只有 3 个不同单词");
        check(Main.wordCount("").isEmpty(), "空字符串应返回空 Map");
        check(Main.wordCount(null).isEmpty(), "null 应返回空 Map");`,
        },
        {
          id: "m7-2",
          kind: "code",
          title: "按词频取 Top N",
          difficulty: "★★★",
          prompt:
            "实现 <code>topN(List&lt;String&gt; words, int n)</code>：统计每个单词出现次数（区分大小写），按次数降序、次数相同按字典序升序，返回前 n 个单词。n 小于等于 0 返回空列表。",
          starter: String.raw`import java.util.*;

public class Main {
    static List<String> topN(List<String> words, int n) {
        // TODO: 计数 + 排序 + 截取
        return List.of();
    }

    public static void main(String[] args) {
        System.out.println(topN(List.of("java", "stream", "java", "lambda", "stream", "record"), 2));
    }
}`,
          hints: [
            "先统计到 <code>Map&lt;String, Integer&gt;</code>，再对 <code>entrySet</code> 排序。",
            "比较器：<code>comparingByValue().reversed().thenComparing(comparingByKey())</code>。",
            "截取用 <code>Math.min(n, list.size())</code>，别越界。",
          ],
          solution: String.raw`import java.util.*;

public class Main {
    static List<String> topN(List<String> words, int n) {
        if (words == null || n <= 0) return List.of();
        Map<String, Integer> counts = new HashMap<>();
        for (String w : words) counts.merge(w, 1, Integer::sum);

        List<Map.Entry<String, Integer>> entries = new ArrayList<>(counts.entrySet());
        entries.sort(Map.Entry.<String, Integer>comparingByValue().reversed()
                .thenComparing(Map.Entry.comparingByKey()));

        List<String> result = new ArrayList<>();
        for (int i = 0; i < Math.min(n, entries.size()); i++) {
            result.add(entries.get(i).getKey());
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(topN(List.of("java", "stream", "java", "lambda", "stream", "record"), 2));
    }
}`,
          check: String.raw`        List<String> input = Arrays.asList("java", "stream", "java", "lambda", "stream", "record");
        List<String> top2 = Main.topN(input, 2);
        eq(top2.size(), 2, "Top2 应返回 2 个单词");
        eq(top2.get(0), "java", "java 和 stream 都是 2 次，java 字典序更小");
        eq(top2.get(1), "stream", "stream 应为第 2");
        eq(Main.topN(input, 0), List.of(), "n=0 返回空列表");
        eq(Main.topN(input, 10).size(), 4, "n 超过不同单词数时返回全部");`,
        },
        {
          id: "m7-3",
          kind: "code",
          title: "去重并排序",
          difficulty: "★★☆",
          prompt:
            "实现 <code>uniqueSorted(List&lt;Integer&gt; nums)</code>，去掉重复值并按升序返回。null 或空列表返回空列表，不能修改入参。",
          starter: String.raw`import java.util.*;

public class Main {
    static List<Integer> uniqueSorted(List<Integer> nums) {
        // TODO
        return List.of();
    }

    public static void main(String[] args) {
        System.out.println(uniqueSorted(List.of(3, 1, 2, 2, 3)));
    }
}`,
          hints: [
            "<code>TreeSet</code> 同时完成去重和排序。",
            "<code>new TreeSet&lt;&gt;(nums)</code>，再 <code>new ArrayList&lt;&gt;(set)</code>。",
          ],
          solution: String.raw`import java.util.*;

public class Main {
    static List<Integer> uniqueSorted(List<Integer> nums) {
        if (nums == null || nums.isEmpty()) return List.of();
        return new ArrayList<>(new TreeSet<>(nums));
    }

    public static void main(String[] args) {
        System.out.println(uniqueSorted(List.of(3, 1, 2, 2, 3)));
    }
}`,
          check: String.raw`        List<Integer> input = new ArrayList<>(List.of(3, 1, 2, 2, 3));
        eq(Main.uniqueSorted(input), List.of(1, 2, 3), "去重升序结果不对");
        eq(input, List.of(3, 1, 2, 2, 3), "不能修改入参");
        eq(Main.uniqueSorted(null), List.of(), "null 返回空列表");`,
        },
        {
          id: "m7-4",
          kind: "quiz",
          question: "把一个自定义对象用作 <code>HashMap</code> 的 key，最必须保证的是什么？",
          options: [
            "重写 toString",
            "实现 Comparable",
            "equals 与 hashCode 保持一致：equals 为 true 时 hashCode 必须相同",
            "字段必须是 public",
          ],
          answer: 2,
          explain:
            "HashMap 先用 hashCode 找桶，再用 equals 精确定位。两者不一致会导致相同的 key 存进去取不出来，甚至同一个逻辑 key 被存成多个条目。record 或 Objects.equals/hash 是最省心的做法。",
        },
      ],
      further: [
        "《Java 核心技术 卷 I》第 9 章：集合 —— List、Set、Map、迭代器。",
        "《Effective Java 第 3 版》条目 11：覆盖 equals 时总要覆盖 hashCode。",
        "GitHub: Snailclimb/JavaGuide 的 Java 集合框架章节（ArrayList 扩容、HashMap 红黑树）。",
      ],
    },

    /* ============================================================ 08 */
    {
      id: "exceptions",
      title: "异常：别吞、别乱抛、别用异常做流程",
      summary:
        "异常设计是工程能力的分水岭。检查型与非检查型的选择、try-with-resources 的关闭顺序、异常链是否保留原因，都会影响线上排障速度。",
      level: "中级核心",
      minutes: 30,
      objectives: [
        "区分 checked / unchecked 异常，并知道该抛哪一种",
        "正确使用 try-catch-finally 与 try-with-resources",
        "写自定义异常，保留原始异常链",
        "识别“吞异常”“用异常控制流程”等坏味道",
      ],
      sections: [
        { type: "h", text: "Throwable 家族" },
        {
          type: "table",
          head: ["类型", "是否必须处理", "典型例子", "使用场景"],
          rows: [
            ["Error", "否", "OutOfMemoryError、StackOverflowError", "JVM 级问题，通常无法恢复"],
            ["RuntimeException", "否（unchecked）", "NullPointerException、IllegalArgumentException", "编程错误、参数非法"],
            ["Exception（非 Runtime）", "是（checked）", "IOException、SQLException", "可预期的外部失败"],
          ],
        },
        {
          type: "callout",
          tone: "deep",
          title: "checked 还是 unchecked",
          html: "调用方<strong>能合理恢复</strong>的失败（文件不存在可以重试、余额不足可以提示）适合 checked；调用方<strong>无法处理</strong>的编程错误（参数为 null、状态非法）适合 unchecked。不要为了“强制处理”把所有异常都声明成 checked，那会逼出大量空 catch。",
        },
        { type: "h", text: "try-catch-finally 的执行顺序" },
        {
          type: "code",
          file: "TryDemo.java",
          code: String.raw`public class TryDemo {
    public static void main(String[] args) {
        try {
            int[] arr = new int[2];
            System.out.println(arr[3]);
        } catch (ArrayIndexOutOfBoundsException e) {
            System.out.println("捕获：" + e.getMessage());
        } finally {
            System.out.println("finally 一定执行");
        }
        System.out.println("程序继续");
    }
}`,
          output: "捕获：Index 3 out of bounds for length 2\nfinally 一定执行\n程序继续",
        },
        {
          type: "p",
          html: "finally 在正常结束、异常、return 之前都会执行（<code>System.exit</code> 等极端情况除外）。但不要在 finally 里写 return，它会覆盖 try 里的返回值并吞掉异常。",
        },
        { type: "h", text: "多个 catch 与异常链" },
        {
          type: "code",
          file: "MultiCatch.java",
          code: String.raw`public class MultiCatch {
    public static void main(String[] args) {
        String input = "abc";
        try {
            int n = Integer.parseInt(input);
            System.out.println(10 / n);
        } catch (NumberFormatException | ArithmeticException e) {
            System.out.println("输入有问题：" + e.getClass().getSimpleName());
        }
    }
}`,
          output: "输入有问题：NumberFormatException",
        },
        {
          type: "p",
          html: "捕获后用 <code>throw new BizException(\"上下文\", e)</code> 包装，能保留原始堆栈（异常链）。只写 <code>throw new BizException(msg)</code> 会丢掉根因，线上只能看到最外层。",
        },
        { type: "h", text: "try-with-resources：自动关闭" },
        {
          type: "code",
          file: "ResourceDemo.java",
          code: String.raw`import java.io.BufferedReader;
import java.io.StringReader;

public class ResourceDemo {
    public static void main(String[] args) throws Exception {
        try (BufferedReader reader = new BufferedReader(new StringReader("第一行\n第二行"))) {
            System.out.println(reader.readLine());
        }
        // 离开 try 块时自动调用 close()，即使抛异常也会关闭
    }
}`,
          output: "第一行",
        },
        {
          type: "list",
          items: [
            "资源必须实现 <code>AutoCloseable</code>（或 <code>Closeable</code>）。",
            "多个资源用分号隔开，关闭顺序与声明顺序相反。",
            "不要再用 <code>finally { resource.close(); }</code> 的老写法，容易空指针且吞异常。",
          ],
        },
        { type: "h", text: "自定义异常" },
        {
          type: "code",
          file: "BizException.java",
          code: String.raw`class BizException extends RuntimeException {
    private final String code;

    BizException(String code, String message) {
        super(message);
        this.code = code;
    }

    BizException(String code, String message, Throwable cause) {
        super(message, cause);
        this.code = code;
    }

    String getCode() { return code; }
}`,
        },
        {
          type: "list",
          items: [
            "业务异常通常继承 <code>RuntimeException</code>，避免污染每个方法的 throws 声明。",
            "异常类名要表达问题，不要叫 <code>CommonException</code>、<code>BaseException</code>。",
            "携带错误码、上下文 ID，方便日志检索。",
            "异常信息写给“半夜被叫起来排障的人”看：什么值、期望什么、下一步查哪里。",
          ],
        },
        { type: "h", text: "四个坏味道" },
        {
          type: "table",
          head: ["坏味道", "为什么坏", "替代做法"],
          rows: [
            ["catch (Exception e) {}", "吞异常，问题永远消失", "至少记录日志并保留堆栈"],
            ["用异常做正常分支", "异常堆栈昂贵，可读性差", "用返回值 / Optional 表达预期结果"],
            ["catch 后不处理也不抛", "调用方以为成功", "包装成业务异常向上抛"],
            ["finally 里 return", "覆盖返回值、吞异常", "只做资源清理"],
          ],
        },
        {
          type: "callout",
          tone: "warn",
          title: "日志和异常都要带上下文",
          html: "只打印 <code>e.getMessage()</code> 会丢掉堆栈。用日志框架时传异常对象本身（<code>log.error(\"下单失败 orderId={}\", id, e)</code>），而不是拼进字符串。",
        },
      ],
      exercises: [
        {
          id: "m8-1",
          kind: "code",
          title: "解析正整数",
          difficulty: "★★☆",
          prompt:
            "实现 <code>parsePositive(String text)</code>：去掉首尾空格后解析为整数，要求大于 0。null、空白、非数字、小于等于 0 都抛出 <code>IllegalArgumentException</code>，异常信息包含 <code>非法输入</code>。",
          starter: String.raw`public class Main {
    static int parsePositive(String text) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        System.out.println(parsePositive(" 42 "));
    }
}`,
          hints: [
            "先判 <code>text == null || text.isBlank()</code>。",
            "<code>Integer.parseInt(text.trim())</code> 会抛 <code>NumberFormatException</code>（它是 IllegalArgumentException 的子类，但最好显式捕获并换成自己的信息）。",
            "最后判断 <code>value &lt;= 0</code>。",
          ],
          solution: String.raw`public class Main {
    static int parsePositive(String text) {
        if (text == null || text.isBlank()) {
            throw new IllegalArgumentException("非法输入：不能为空");
        }
        int value;
        try {
            value = Integer.parseInt(text.trim());
        } catch (NumberFormatException e) {
            throw new IllegalArgumentException("非法输入：" + text, e);
        }
        if (value <= 0) {
            throw new IllegalArgumentException("非法输入：必须大于 0，实际 " + value);
        }
        return value;
    }

    public static void main(String[] args) {
        System.out.println(parsePositive(" 42 "));
    }
}`,
          check: String.raw`        eq(Main.parsePositive(" 42 "), 42, "应去掉首尾空格");
        String[] bad = {null, "", "   ", "abc", "0", "-3"};
        for (String s : bad) {
            boolean thrown = false;
            try { Main.parsePositive(s); } catch (IllegalArgumentException e) {
                thrown = String.valueOf(e.getMessage()).contains("非法输入");
            }
            check(thrown, "输入 [" + s + "] 应抛出含“非法输入”的 IllegalArgumentException");
        }`,
        },
        {
          id: "m8-2",
          kind: "code",
          title: "自定义检查型异常",
          difficulty: "★★★",
          prompt:
            "补全 <code>InvalidAgeException</code>（继承 <code>Exception</code>，带 message 构造器）和 <code>AgeValidator.check(int age)</code>：年龄小于 18 抛异常，信息为 <code>年龄必须满 18 岁</code>。",
          starter: String.raw`class InvalidAgeException extends Exception {
    // TODO: 添加构造器
}

class AgeValidator {
    static void check(int age) throws InvalidAgeException {
        // TODO
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        AgeValidator.check(20);
        System.out.println("合法");
    }
}`,
          hints: [
            "<code>InvalidAgeException(String message) { super(message); }</code>。",
            "方法签名已经声明 <code>throws InvalidAgeException</code>，直接 <code>throw new ...</code>。",
          ],
          solution: String.raw`class InvalidAgeException extends Exception {
    InvalidAgeException(String message) {
        super(message);
    }
}

class AgeValidator {
    static void check(int age) throws InvalidAgeException {
        if (age < 18) {
            throw new InvalidAgeException("年龄必须满 18 岁");
        }
    }
}

public class Main {
    public static void main(String[] args) throws Exception {
        AgeValidator.check(20);
        System.out.println("合法");
    }
}`,
          check: String.raw`        boolean thrown = false;
        try {
            AgeValidator.check(17);
        } catch (InvalidAgeException e) {
            thrown = "年龄必须满 18 岁".equals(e.getMessage());
        }
        check(thrown, "17 岁应抛出 InvalidAgeException，且 message 正确");
        thrown = false;
        try {
            AgeValidator.check(18);
        } catch (InvalidAgeException e) {
            thrown = true;
        }
        check(!thrown, "18 岁应通过校验");
        thrown = false;
        try {
            AgeValidator.check(30);
        } catch (InvalidAgeException e) {
            thrown = true;
        }
        check(!thrown, "30 岁应通过校验");`,
        },
        {
          id: "m8-3",
          kind: "code",
          title: "用异常判断输入类型",
          difficulty: "★★☆",
          prompt:
            "实现 <code>classify(String text)</code>：能解析为整数返回 <code>整数</code>，能解析为小数返回 <code>小数</code>，否则返回 <code>非数字</code>。null、空白也算非数字。",
          starter: String.raw`public class Main {
    static String classify(String text) {
        // TODO
        return "非数字";
    }

    public static void main(String[] args) {
        System.out.println(classify("42"));
        System.out.println(classify("3.14"));
        System.out.println(classify("abc"));
    }
}`,
          hints: [
            "先 <code>Integer.parseInt</code>，捕获 <code>NumberFormatException</code> 后再试 <code>Double.parseDouble</code>。",
            "两次都不成功才返回“非数字”。",
          ],
          solution: String.raw`public class Main {
    static String classify(String text) {
        if (text == null || text.isBlank()) return "非数字";
        String value = text.trim();
        try {
            Integer.parseInt(value);
            return "整数";
        } catch (NumberFormatException ignored) {
            try {
                Double.parseDouble(value);
                return "小数";
            } catch (NumberFormatException e) {
                return "非数字";
            }
        }
    }

    public static void main(String[] args) {
        System.out.println(classify("42"));
        System.out.println(classify("3.14"));
        System.out.println(classify("abc"));
    }
}`,
          check: String.raw`        eq(Main.classify("42"), "整数", "42 是整数");
        eq(Main.classify(" 42 "), "整数", "应忽略首尾空格");
        eq(Main.classify("3.14"), "小数", "3.14 是小数");
        eq(Main.classify("abc"), "非数字", "abc 不是数字");
        eq(Main.classify(null), "非数字", "null 不是数字");
        eq(Main.classify(""), "非数字", "空串不是数字");`,
        },
        {
          id: "m8-4",
          kind: "quiz",
          question: "关于 <code>finally</code>，下面哪句最准确？",
          options: [
            "只有 try 正常结束时才执行",
            "只有捕获到异常时才执行",
            "除非 JVM 被强制退出，正常结束、抛异常、return 之前都会执行",
            "finally 里的 return 会保留 try 中的返回值",
          ],
          answer: 2,
          explain:
            "finally 在 try/catch 结束后、方法返回前执行，无论是否异常。若 finally 里写 return，会覆盖 try 中的返回值，并且可能吞掉未处理的异常，所以工程规范通常禁止这样做。",
        },
      ],
      further: [
        "《Effective Java 第 3 版》条目 69–77：异常相关（只对异常情况使用异常、恢复可用状态、避免不必要的 checked 异常）。",
        "《Java 核心技术 卷 I》第 7 章：异常、断言与日志。",
        "《阿里巴巴 Java 开发手册》：异常处理规约与日志规约。",
      ],
    },
  ],
});
