/* 速查表：写代码时想不起来语法就来这里找。
   每条都能直接复制到「自由练习场」的 Main.java 里运行。 */
window.CHEATSHEET = [
  {
    name: "基础语法",
    items: [
      {
        t: "程序骨架",
        code: `public class Main {
    public static void main(String[] args) {
        System.out.println("Hello");
    }
}`,
        note: "文件名必须是 Main.java；一个文件最多一个 public 类。",
      },
      {
        t: "格式化输出",
        code: `System.out.printf("%-6s|%4d|%.2f%n", "Lin", 25, 0.875);`,
        note: "%-6s 左对齐宽 6，%4d 右对齐宽 4，%n 平台无关换行。",
      },
      {
        t: "switch 表达式",
        code: `String level = switch (score / 10) {
    case 10, 9 -> "A";
    case 8 -> "B";
    default -> "C";
};`,
        note: "箭头不会穿透，整个表达式必须有返回值。",
      },
      {
        t: "增强 for 与标签",
        code: `outer:
for (int i = 0; i < 3; i++) {
    for (int j = 0; j < 3; j++) {
        if (i * j == 2) break outer;
    }
}`,
        note: "标签写在循环前，break/continue 后接标签名。",
      },
      {
        t: "var 类型推断",
        code: `var list = new ArrayList<String>();
var map = new HashMap<String, Integer>();`,
        note: "只能用于局部变量，必须初始化，推断后类型固定。",
      },
    ],
  },
  {
    name: "字符串与正则",
    items: [
      {
        t: "String.format 与拼接",
        code: `String s = String.format("%s-%03d", "A", 7);   // A-007
String joined = String.join(",", List.of("a", "b")); // a,b`,
        note: "循环拼接不要用 +，用 StringBuilder 或 joining。",
      },
      {
        t: "StringBuilder",
        code: `StringBuilder sb = new StringBuilder();
for (int i = 0; i < 5; i++) sb.append(i).append(',');
sb.deleteCharAt(sb.length() - 1);
String out = sb.toString();`,
        note: "单线程用 StringBuilder；多线程共享用 StringBuffer。",
      },
      {
        t: "判断与替换",
        code: `"  Java  ".trim().toLowerCase();       // "java"
"a  b".replaceAll("\\\\s+", " ");       // "a b"
"13812345678".matches("1[3-9]\\\\d{9}"); // true`,
        note: "matches 要求整个字符串完全匹配；find 才是部分匹配。",
      },
      {
        t: "Pattern 提取",
        code: `Pattern p = Pattern.compile("(\\\\w+)=(\\\\d+)");
Matcher m = p.matcher("a=1 b=22");
while (m.find()) {
    System.out.println(m.group(1) + " -> " + m.group(2));
}`,
        note: "高频校验把 Pattern 提成 static final，避免重复编译。",
      },
      {
        t: "文本块",
        code: `String json = """
        {"name": "JavaForge"}
        """;
System.out.println(json.strip());`,
        note: "Java 15+；三引号内的缩进会按最小公共缩进剥离。",
      },
    ],
  },
  {
    name: "集合",
    items: [
      {
        t: "List 常用操作",
        code: `List<String> list = new ArrayList<>(List.of("a", "b"));
list.add("c");
list.remove("b");              // 按对象
list.remove(0);                // 按下标
list.set(0, "x");
list.removeIf(s -> s.startsWith("x"));`,
        note: "List<Integer> 的 remove(1) 删的是下标，不是值 1。",
      },
      {
        t: "Map 计数",
        code: `Map<String, Integer> counts = new HashMap<>();
for (String w : words) counts.merge(w, 1, Integer::sum);
counts.getOrDefault("java", 0);`,
        note: "merge 比 get + null 判断更安全、更短。",
      },
      {
        t: "遍历 Map",
        code: `for (Map.Entry<String, Integer> e : map.entrySet()) {
    System.out.println(e.getKey() + "=" + e.getValue());
}
map.forEach((k, v) -> System.out.println(k + "=" + v));`,
        note: "不要在 for-each 里直接 map.remove，用 removeIf 或 Iterator。",
      },
      {
        t: "去重与排序",
        code: `List<Integer> sorted = new ArrayList<>(new TreeSet<>(nums));
Map<String, Integer> ordered = new TreeMap<>();
Set<String> linked = new LinkedHashSet<>();`,
        note: "TreeSet/TreeMap 排序，LinkedHashSet 保持插入顺序，HashSet 不保证顺序。",
      },
      {
        t: "Comparator 链",
        code: `list.sort(Comparator.comparingInt(Student::score).reversed()
        .thenComparing(Student::name));`,
        note: "并列条件要显式写，否则排序结果不可复现。",
      },
    ],
  },
  {
    name: "泛型",
    items: [
      {
        t: "泛型类",
        code: `class Box<T> {
    private T value;
    void set(T value) { this.value = value; }
    T get() { return value; }
}`,
        note: "T 只是编译期占位符，运行时被擦除成 Object。",
      },
      {
        t: "泛型方法",
        code: `static <T extends Comparable<T>> T max(List<T> list) {
    return list.stream().max(Comparator.naturalOrder()).orElseThrow();
}`,
        note: "类型参数写在返回类型前；extends 在这里表示“上界”。",
      },
      {
        t: "通配符 PECS",
        code: `static double sum(List<? extends Number> nums) { ... }  // 只读
static void addAll(List<? super Integer> target) { ... }   // 只写`,
        note: "Producer Extends, Consumer Super。",
      },
      {
        t: "泛型限制",
        code: `// 不能 new T();
// 不能 new T[10];
// 不能 if (list instanceof List<String>);
// 静态字段不能用类上的 T`,
        note: "需要运行时类型时传 Class<T> 类型令牌。",
      },
      {
        t: "可变参数",
        code: `@SafeVarargs
static <T> List<T> of(T... items) {
    return List.of(items);
}`,
        note: "可变参数本质是数组；泛型可变参数要加 @SafeVarargs 抑制警告。",
      },
    ],
  },
  {
    name: "Stream 与 Optional",
    items: [
      {
        t: "常用管道",
        code: `List<String> names = people.stream()
    .filter(p -> p.age() >= 18)
    .map(Person::name)
    .sorted()
    .collect(Collectors.toList());`,
        note: "中间操作惰性；遇到 collect / count / forEach 才执行。",
      },
      {
        t: "分组与聚合",
        code: `Map<String, Double> avg = list.stream().collect(
    Collectors.groupingBy(Employee::dept,
        Collectors.averagingDouble(Employee::score)));`,
        note: "还有 summingInt、counting、joining、partitioningBy。",
      },
      {
        t: "toMap 防重复",
        code: `Map<String, Integer> map = list.stream().collect(
    Collectors.toMap(Item::id, Item::qty, Integer::sum));`,
        note: "不加合并函数时，重复 key 会抛 IllegalStateException。",
      },
      {
        t: "Optional 链",
        code: `Optional<String> result = Optional.ofNullable(input)
    .map(String::trim)
    .filter(s -> !s.isEmpty());
result.ifPresentOrElse(System.out::println, () -> System.out.println("空"));`,
        note: "不要用 Optional 做字段；不要 optional.get() 不检查。",
      },
      {
        t: "并行流",
        code: `long count = bigList.parallelStream()
    .filter(x -> x > 0)
    .count();`,
        note: "只适合大数组、无状态、CPU 密集；IO 与共享状态不要用。",
      },
    ],
  },
  {
    name: "异常",
    items: [
      {
        t: "try-catch-finally",
        code: `try {
    int n = Integer.parseInt(input);
} catch (NumberFormatException e) {
    throw new IllegalArgumentException("非法输入", e);
} finally {
    // 只做清理，不要 return
}`,
        note: "finally 里 return 会覆盖返回值并吞异常。",
      },
      {
        t: "try-with-resources",
        code: `try (BufferedReader reader = Files.newBufferedReader(path)) {
    return reader.readLine();
}`,
        note: "资源必须实现 AutoCloseable；关闭顺序与声明相反。",
      },
      {
        t: "多重捕获",
        code: `try {
    // ...
} catch (NumberFormatException | ArithmeticException e) {
    System.out.println(e.getClass().getSimpleName());
}`,
        note: "捕获类型不能有父子关系。",
      },
      {
        t: "自定义异常",
        code: `class BizException extends RuntimeException {
    BizException(String message, Throwable cause) {
        super(message, cause);
    }
}`,
        note: "业务异常通常继承 RuntimeException；保留 cause 才能看到根因。",
      },
      {
        t: "异常链",
        code: `throw new IllegalStateException("加载配置失败", e);`,
        note: "只传 message 会丢掉原始堆栈，排障时找不到根因。",
      },
    ],
  },
  {
    name: "日期与时间",
    items: [
      {
        t: "当前时间",
        code: `LocalDate today = LocalDate.now();
LocalDateTime now = LocalDateTime.now();
Instant instant = Instant.now();`,
        note: "LocalDate 只有日期；Instant 是 UTC 时间点。",
      },
      {
        t: "解析与格式化",
        code: `LocalDate date = LocalDate.parse("2026-11-03");
DateTimeFormatter fmt = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm");
String text = LocalDateTime.now().format(fmt);`,
        note: "DateTimeFormatter 线程安全，可共享；SimpleDateFormat 不行。",
      },
      {
        t: "日期计算",
        code: `LocalDate next = date.plusDays(30);
long days = ChronoUnit.DAYS.between(start, end);
Duration d = Duration.ofMinutes(95);`,
        note: "跨时区用 ZonedDateTime / OffsetDateTime。",
      },
      {
        t: "比较",
        code: `date.isBefore(other);
date.isAfter(other);
date.isEqual(other);`,
        note: "不要用 equals 比较不同精度的时间对象。",
      },
      {
        t: "可测试的时钟",
        code: `Clock fixed = Clock.fixed(Instant.parse("2026-11-03T10:00:00Z"), ZoneOffset.UTC);
LocalDate today = LocalDate.now(fixed);`,
        note: "业务代码注入 Clock，测试不依赖真实时间。",
      },
    ],
  },
  {
    name: "文件 IO",
    items: [
      {
        t: "读小文件",
        code: `List<String> lines = Files.readAllLines(Path.of("demo.txt"));
String text = Files.readString(Path.of("demo.txt"));`,
        note: "默认 UTF-8；大文件不要用 readAllLines。",
      },
      {
        t: "流式读大文件",
        code: `try (Stream<String> lines = Files.lines(Path.of("big.log"))) {
    long count = lines.filter(s -> s.contains("ERROR")).count();
}`,
        note: "Files.lines 必须关闭；用 try-with-resources。",
      },
      {
        t: "写文件",
        code: `Files.writeString(Path.of("out.txt"), "hello");
Files.writeString(Path.of("out.txt"), "more",
        StandardOpenOption.APPEND);`,
        note: "默认覆盖；追加要显式传 StandardOpenOption.APPEND。",
      },
      {
        t: "路径拼接",
        code: `Path dir = Path.of("data");
Path file = dir.resolve("app.log");
Files.createDirectories(dir);`,
        note: "不要手工拼 / 或 \\，用 resolve。",
      },
      {
        t: "编码",
        code: `new InputStreamReader(in, StandardCharsets.UTF_8);
Files.readString(path, StandardCharsets.UTF_8);`,
        note: "不指定编码会用平台默认值，Windows 上容易出现乱码。",
      },
    ],
  },
  {
    name: "并发",
    items: [
      {
        t: "线程池",
        code: `ExecutorService pool = Executors.newFixedThreadPool(4);
Future<Integer> f = pool.submit(() -> 42);
int value = f.get();
pool.shutdown();`,
        note: "生产环境用 ThreadPoolExecutor 显式指定有界队列与拒绝策略。",
      },
      {
        t: "原子计数",
        code: `AtomicInteger count = new AtomicInteger();
count.incrementAndGet();
count.addAndGet(10);`,
        note: "volatile 不保证 count++ 的原子性。",
      },
      {
        t: "同步方法",
        code: `synchronized void increment() {
    count++;
}
synchronized int get() { return count; }`,
        note: "锁要覆盖复合操作；不要在锁内做 IO 或远程调用。",
      },
      {
        t: "CompletableFuture",
        code: `CompletableFuture<String> a = CompletableFuture.supplyAsync(() -> "a", pool);
String result = a.thenApply(String::toUpperCase).join();`,
        note: "异步任务要传自定义线程池，异常用 exceptionally / handle 处理。",
      },
      {
        t: "并发集合",
        code: `Map<String, Integer> map = new ConcurrentHashMap<>();
map.merge("k", 1, Integer::sum);
BlockingQueue<String> queue = new LinkedBlockingQueue<>(100);`,
        note: "ConcurrentHashMap 的复合操作要用 merge / compute，别先 get 再 put。",
      },
    ],
  },
  {
    name: "工程与测试",
    items: [
      {
        t: "Maven 依赖作用域",
        code: `<scope>test</scope>      <!-- JUnit，不进生产包 -->
<scope>provided</scope>  <!-- Servlet API，容器提供 -->
<scope>runtime</scope>   <!-- JDBC 驱动，编译不需要 -->`,
        note: "默认 compile：编译、测试、运行都可见。",
      },
      {
        t: "JUnit 5 断言",
        code: `assertEquals(expected, actual);
assertThrows(IllegalArgumentException.class, () -> service.run(null));
assertAll(
    () -> assertEquals(1, list.size()),
    () -> assertTrue(list.contains("a")));`,
        note: "一个测试只验证一件事；方法名写行为与期望。",
      },
      {
        t: "参数化测试",
        code: `@ParameterizedTest
@CsvSource({"1,1,2", "2,3,5"})
void add(int a, int b, int expected) {
    assertEquals(expected, calculator.add(a, b));
}`,
        note: "边界值最适合参数化：0、负数、最大值。",
      },
      {
        t: "日志",
        code: `private static final Logger log = LoggerFactory.getLogger(OrderService.class);
log.info("创建订单 orderId={} amount={}", orderId, amount);
log.error("下单失败 orderId={}", orderId, e);`,
        note: "用占位符；异常对象作为最后一个参数传入才会打印堆栈。",
      },
      {
        t: "调试快捷键（IDEA）",
        code: `F8  单步跳过（Step Over）
F7  单步进入（Step Into）
Shift+F8  跳出
Alt+F8  计算表达式
Ctrl+F8  行断点 / 条件断点`,
        note: "条件断点比 println 更快定位循环里的异常数据。",
      },
    ],
  },
];
