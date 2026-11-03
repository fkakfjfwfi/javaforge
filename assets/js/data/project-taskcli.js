/* 项目 01 · 任务 CLI
   领域模型 + 内存仓储 + 查询/统计。练的是“把业务规则放进类里”，而不是散落在 main。 */
window.PROJECTS = window.PROJECTS || [];
window.PROJECTS.push({
  id: "task-cli",
  index: "01",
  type: "project",
  title: "TaskCLI 任务管理器",
  subtitle: "领域模型、内存仓储与查询统计",
  summary:
    "不依赖数据库和框架，只用标准库写一个可扩展的命令行任务管理器。重点是把校验、状态流转、查询规则收进模型与仓储层，让 main 只负责编排。",
  level: "入门项目",
  duration: "4–6 小时",
  mode: "core",
  modeLabel: "标准库",
  accent: "#2f6488",
  stack: ["Java 17+", "集合", "Stream", "record", "CLI"],
  resumeLine: "基于 Java 标准库实现分层任务管理 CLI，包含领域校验、内存仓储与统计报表",
  resume: {
    keywords: ["面向对象", "集合", "Stream", "参数校验", "CLI"],
    bullets: [
      "设计 Task 领域模型，在构造器中完成标题/优先级校验，杜绝非法对象进入系统。",
      "实现基于 LinkedHashMap 的 TaskRepository，支持 O(1) 按标题查找与稳定顺序遍历。",
      "用 Stream 完成过滤、排序与统计，输出完成率报表；核心逻辑全部可单元测试。",
      "通过命令行参数解析与交互菜单解耦业务逻辑，main 只负责输入输出编排。",
    ],
  },
  highlights: [
    "领域模型自己守不变量：非法标题、越界优先级根本创建不出来。",
    "仓储接口与内存实现分离，后续替换成文件/数据库不需要改业务代码。",
    "查询与统计写成纯函数，输入列表输出结果，最容易写测试。",
    "4 个检查点覆盖模型、仓储、查询、报表，全部可以在浏览器里直接判题。",
  ],
  sections: [
    { type: "h", text: "要解决的问题" },
    {
      type: "p",
      html: "任务管理器看起来简单，但真正写起来会遇到：标题重复、优先级越界、完成状态被随意修改、查询逻辑散落在 main、统计口径不一致。这个项目刻意把这些点拆成四层，每一层只做一件事。",
    },
    {
      type: "table",
      head: ["层", "职责", "不应该出现的东西"],
      rows: [
        ["Task（domain）", "表达任务与状态流转，校验字段", "Scanner、System.out、文件路径"],
        ["TaskRepository", "保存、查找、删除、列出", "业务规则、格式化输出"],
        ["Query / Report", "过滤、排序、统计", "I/O、可变全局状态"],
        ["Main（CLI）", "解析参数、调用上面三层、打印", "直接改 Task 的内部字段"],
      ],
    },
    { type: "h", text: "为什么用 LinkedHashMap" },
    {
      type: "p",
      html: "任务列表需要“插入顺序稳定”，否则每次展示顺序都在变。<code>LinkedHashMap</code> 同时提供 O(1) 查找和插入顺序；如果需要按优先级展示，再在查询层排序，而不是让存储层承担展示职责。",
    },
    {
      type: "callout",
      tone: "deep",
      title: "状态流转要收口",
      html: "不要让外部直接写 <code>task.done = true</code>。提供 <code>complete()</code> / <code>reopen()</code>，未来要加“完成时间”“完成人”“不能重复完成”时，只改一个地方。",
    },
  ],
  architecture: {
    tree: `task-cli/
├── src/main/java/com/example/task/
│   ├── Main.java              # CLI 入口：参数解析与菜单
│   ├── domain/Task.java       # 任务模型与状态流转
│   ├── repository/TaskRepository.java
│   └── service/TaskQueries.java  # 过滤、排序、统计（纯函数）
└── src/test/java/com/example/task/
    ├── TaskTest.java
    └── TaskQueriesTest.java`,
    notes: [
      "domain 不依赖任何其他层，可以直接 new 出来测试。",
      "repository 只负责存取，不负责排序和格式化。",
      "查询层接收 List<Task>，返回新列表/报表字符串，不产生副作用。",
      "Main 负责 Scanner、参数解析和异常到用户提示的转换。",
    ],
  },
  milestones: [
    { title: "M1 领域模型", desc: "把校验和状态流转放进 Task，保证非法对象创建不出来。", exIds: ["pr1-1"] },
    { title: "M2 内存仓储", desc: "用 LinkedHashMap 实现增删查列，重复标题要拒绝。", exIds: ["pr1-2"] },
    { title: "M3 查询与排序", desc: "按完成状态过滤，按优先级、标题排序，返回新列表。", exIds: ["pr1-3"] },
    { title: "M4 统计报表", desc: "输出总数、完成数、待办数与完成率，口径固定。", exIds: ["pr1-4"] },
  ],
  exercises: [
    {
      id: "pr1-1",
      kind: "code",
      title: "Task 模型与校验",
      difficulty: "★★☆",
      prompt:
        "补全 <code>Task</code>：标题不能为 null 或空白；优先级必须在 1~5，否则抛 <code>IllegalArgumentException</code>。<code>complete()</code> 把状态设为已完成，<code>reopen()</code> 恢复未完成。<code>title()</code>、<code>priority()</code>、<code>isDone()</code> 已给出。",
      starter: String.raw`class Task {
    private final String title;
    private final int priority;
    private boolean done;

    Task(String title, int priority) {
        // TODO: 校验后赋值
        this.title = title;
        this.priority = priority;
    }

    String title() { return title; }
    int priority() { return priority; }
    boolean isDone() { return done; }

    void complete() {
        // TODO
    }

    void reopen() {
        // TODO
    }
}

public class Main {
    public static void main(String[] args) {
        Task t = new Task("复习集合", 2);
        t.complete();
        System.out.println(t.title() + " / " + t.isDone());
    }
}`,
      hints: [
        "标题校验：<code>title == null || title.isBlank()</code>。",
        "优先级越界：<code>priority &lt; 1 || priority &gt; 5</code>。",
        "状态方法只是给 <code>done</code> 赋 true / false。",
      ],
      solution: String.raw`class Task {
    private final String title;
    private final int priority;
    private boolean done;

    Task(String title, int priority) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("标题不能为空");
        if (priority < 1 || priority > 5) throw new IllegalArgumentException("优先级必须在 1~5");
        this.title = title;
        this.priority = priority;
    }

    String title() { return title; }
    int priority() { return priority; }
    boolean isDone() { return done; }

    void complete() { done = true; }
    void reopen() { done = false; }
}

public class Main {
    public static void main(String[] args) {
        Task t = new Task("复习集合", 2);
        t.complete();
        System.out.println(t.title() + " / " + t.isDone());
    }
}`,
      check: String.raw`        Task t = new Task("复习集合", 2);
        eq(t.title(), "复习集合", "标题应保存");
        eq(t.priority(), 2, "优先级应保存");
        check(!t.isDone(), "新建任务默认未完成");
        t.complete();
        check(t.isDone(), "complete 后应为已完成");
        t.reopen();
        check(!t.isDone(), "reopen 后应恢复未完成");
        boolean thrown = false;
        try { new Task(" ", 3); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "空白标题应抛出异常");
        thrown = false;
        try { new Task("合法", 6); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "优先级 6 应抛出异常");`,
    },
    {
      id: "pr1-2",
      kind: "code",
      title: "内存仓储",
      difficulty: "★★★",
      prompt:
        "补全 <code>TaskRepository</code>：<code>add</code> 拒绝重复标题（抛 <code>IllegalArgumentException</code>）；<code>find</code> 找不到返回 null；<code>all</code> 按插入顺序返回副本；<code>remove</code> 返回是否删除成功。",
      starter: String.raw`import java.util.*;

class Task {
    private final String title;
    private final int priority;
    private boolean done;

    Task(String title, int priority) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("标题不能为空");
        this.title = title;
        this.priority = priority;
    }

    String title() { return title; }
    int priority() { return priority; }
    boolean isDone() { return done; }
    void complete() { done = true; }
}

class TaskRepository {
    private final Map<String, Task> store = new LinkedHashMap<>();

    void add(Task task) {
        // TODO: 重复标题抛异常
    }

    Task find(String title) {
        // TODO
        return null;
    }

    List<Task> all() {
        // TODO: 返回副本
        return List.of();
    }

    boolean remove(String title) {
        // TODO
        return false;
    }
}

public class Main {
    public static void main(String[] args) {
        TaskRepository repo = new TaskRepository();
        repo.add(new Task("复习集合", 2));
        System.out.println(repo.find("复习集合").title());
    }
}`,
      hints: [
        "<code>store.containsKey(title)</code> 判断重复。",
        "<code>all()</code> 返回 <code>new ArrayList&lt;&gt;(store.values())</code>，避免外部改内部结构。",
        "<code>remove</code> 可以判断 <code>store.remove(title) != null</code>。",
      ],
      solution: String.raw`import java.util.*;

class Task {
    private final String title;
    private final int priority;
    private boolean done;

    Task(String title, int priority) {
        if (title == null || title.isBlank()) throw new IllegalArgumentException("标题不能为空");
        this.title = title;
        this.priority = priority;
    }

    String title() { return title; }
    int priority() { return priority; }
    boolean isDone() { return done; }
    void complete() { done = true; }
}

class TaskRepository {
    private final Map<String, Task> store = new LinkedHashMap<>();

    void add(Task task) {
        if (task == null) throw new IllegalArgumentException("task 不能为 null");
        if (store.containsKey(task.title())) throw new IllegalArgumentException("重复标题：" + task.title());
        store.put(task.title(), task);
    }

    Task find(String title) {
        return store.get(title);
    }

    List<Task> all() {
        return new ArrayList<>(store.values());
    }

    boolean remove(String title) {
        return store.remove(title) != null;
    }
}

public class Main {
    public static void main(String[] args) {
        TaskRepository repo = new TaskRepository();
        repo.add(new Task("复习集合", 2));
        System.out.println(repo.find("复习集合").title());
    }
}`,
      check: String.raw`        TaskRepository repo = new TaskRepository();
        repo.add(new Task("复习集合", 2));
        repo.add(new Task("写周报", 3));
        eq(repo.all().size(), 2, "应保存两个任务");
        eq(repo.find("复习集合").priority(), 2, "find 应能取回任务");
        eq(repo.find("不存在"), null, "find 找不到应返回 null");
        check(repo.remove("写周报"), "remove 成功应返回 true");
        check(!repo.remove("写周报"), "重复删除应返回 false");
        eq(repo.all().size(), 1, "删除后只剩一个");
        boolean thrown = false;
        try { repo.add(new Task("复习集合", 1)); } catch (IllegalArgumentException e) { thrown = true; }
        check(thrown, "重复标题应抛出 IllegalArgumentException");`,
    },
    {
      id: "pr1-3",
      kind: "code",
      title: "过滤与排序",
      difficulty: "★★★",
      prompt:
        "在 <code>Main</code> 中实现 <code>visibleTasks(List&lt;Task&gt; tasks, boolean includeDone)</code>：按完成状态过滤，按优先级升序（1 最优先），同优先级按标题字典序升序。返回新列表，不修改入参。",
      starter: String.raw`import java.util.*;

class Task {
    private final String title;
    private final int priority;
    private boolean done;

    Task(String title, int priority) {
        this.title = title;
        this.priority = priority;
    }

    String title() { return title; }
    int priority() { return priority; }
    boolean isDone() { return done; }
    void complete() { done = true; }
}

public class Main {
    static List<Task> visibleTasks(List<Task> tasks, boolean includeDone) {
        // TODO
        return List.of();
    }

    public static void main(String[] args) {
        Task a = new Task("a", 2);
        Task b = new Task("b", 1);
        b.complete();
        System.out.println(visibleTasks(List.of(a, b), false).size());
    }
}`,
      hints: [
        "过滤：<code>includeDone || !t.isDone()</code>。",
        "排序：<code>Comparator.comparingInt(Task::priority).thenComparing(Task::title)</code>。",
        "用 <code>new ArrayList&lt;&gt;(tasks)</code> 拷贝后再 <code>sort</code>，不要改原列表。",
      ],
      solution: String.raw`import java.util.*;

class Task {
    private final String title;
    private final int priority;
    private boolean done;

    Task(String title, int priority) {
        this.title = title;
        this.priority = priority;
    }

    String title() { return title; }
    int priority() { return priority; }
    boolean isDone() { return done; }
    void complete() { done = true; }
}

public class Main {
    static List<Task> visibleTasks(List<Task> tasks, boolean includeDone) {
        if (tasks == null) return List.of();
        List<Task> result = new ArrayList<>(tasks);
        result.removeIf(t -> !includeDone && t.isDone());
        result.sort(Comparator.comparingInt(Task::priority).thenComparing(Task::title));
        return result;
    }

    public static void main(String[] args) {
        Task a = new Task("a", 2);
        Task b = new Task("b", 1);
        b.complete();
        System.out.println(visibleTasks(List.of(a, b), false).size());
    }
}`,
      check: String.raw`        Task a = new Task("写周报", 2);
        Task b = new Task("复习集合", 1);
        Task c = new Task("跑步", 2);
        Task d = new Task("已完成", 3);
        d.complete();
        List<Task> input = new ArrayList<>(List.of(a, b, c, d));

        List<Task> pending = Main.visibleTasks(input, false);
        eq(pending.size(), 3, "待办应有 3 个");
        eq(pending.get(0).title(), "复习集合", "优先级 1 应排最前");
        eq(pending.get(1).title(), "写周报", "同优先级按标题字典序");
        eq(pending.get(2).title(), "跑步", "同优先级按标题字典序");

        eq(Main.visibleTasks(input, true).size(), 4, "includeDone=true 应包含全部");
        eq(input.size(), 4, "不能修改入参");
        eq(Main.visibleTasks(null, false), List.of(), "null 返回空列表");`,
    },
    {
      id: "pr1-4",
      kind: "code",
      title: "完成率报表",
      difficulty: "★★★",
      prompt:
        "实现 <code>report(List&lt;Task&gt; tasks)</code>，返回固定格式：<code>总计 N | 完成 D | 待办 P | 完成率 R%</code>。R 用四舍五入的整数百分比；空列表返回 <code>总计 0 | 完成 0 | 待办 0 | 完成率 0%</code>。",
      starter: String.raw`import java.util.*;

class Task {
    private final String title;
    private final int priority;
    private boolean done;

    Task(String title, int priority) {
        this.title = title;
        this.priority = priority;
    }

    String title() { return title; }
    boolean isDone() { return done; }
    void complete() { done = true; }
}

public class Main {
    static String report(List<Task> tasks) {
        // TODO
        return "";
    }

    public static void main(String[] args) {
        System.out.println(report(List.of()));
    }
}`,
      hints: [
        "用 <code>tasks.stream().filter(Task::isDone).count()</code> 统计完成数。",
        "完成率：<code>Math.round(done * 100.0 / total)</code>。",
        "注意 total 为 0 时不能除法。",
      ],
      solution: String.raw`import java.util.*;

class Task {
    private final String title;
    private final int priority;
    private boolean done;

    Task(String title, int priority) {
        this.title = title;
        this.priority = priority;
    }

    String title() { return title; }
    boolean isDone() { return done; }
    void complete() { done = true; }
}

public class Main {
    static String report(List<Task> tasks) {
        if (tasks == null || tasks.isEmpty()) {
            return "总计 0 | 完成 0 | 待办 0 | 完成率 0%";
        }
        int total = tasks.size();
        int done = (int) tasks.stream().filter(Task::isDone).count();
        int pending = total - done;
        int rate = (int) Math.round(done * 100.0 / total);
        return String.format("总计 %d | 完成 %d | 待办 %d | 完成率 %d%%", total, done, pending, rate);
    }

    public static void main(String[] args) {
        System.out.println(report(List.of()));
    }
}`,
      check: String.raw`        Task a = new Task("a", 1);
        Task b = new Task("b", 2);
        Task c = new Task("c", 3);
        Task d = new Task("d", 4);
        Task e = new Task("e", 5);
        a.complete();
        b.complete();
        eq(Main.report(List.of(a, b, c, d, e)), "总计 5 | 完成 2 | 待办 3 | 完成率 40%", "2/5 应为 40%");
        eq(Main.report(List.of()), "总计 0 | 完成 0 | 待办 0 | 完成率 0%", "空列表格式固定");
        eq(Main.report(List.of(a)), "总计 1 | 完成 1 | 待办 0 | 完成率 100%", "全部完成");
        Task f = new Task("f", 1);
        Task g = new Task("g", 1);
        Task h = new Task("h", 1);
        f.complete();
        eq(Main.report(List.of(f, g, h)), "总计 3 | 完成 1 | 待办 2 | 完成率 33%", "1/3 四舍五入为 33%");`,
    },
  ],
  files: [
    {
      name: "domain/Task.java",
      note: "领域模型：字段私有、校验前移、状态方法收口",
      code: String.raw`package com.example.task.domain;

public class Task {
    private final String title;
    private final int priority;   // 1（高）~ 5（低）
    private boolean done;

    public Task(String title, int priority) {
        if (title == null || title.isBlank()) {
            throw new IllegalArgumentException("标题不能为空");
        }
        if (priority < 1 || priority > 5) {
            throw new IllegalArgumentException("优先级必须在 1~5");
        }
        this.title = title;
        this.priority = priority;
    }

    public void complete() { this.done = true; }
    public void reopen() { this.done = false; }

    public String title() { return title; }
    public int priority() { return priority; }
    public boolean isDone() { return done; }
}`,
    },
    {
      name: "repository/TaskRepository.java",
      note: "内存仓储：插入顺序稳定、重复标题拒绝",
      code: String.raw`package com.example.task.repository;

import com.example.task.domain.Task;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

public class TaskRepository {
    private final Map<String, Task> store = new LinkedHashMap<>();

    public void add(Task task) {
        if (task == null) throw new IllegalArgumentException("task 不能为 null");
        if (store.containsKey(task.title())) {
            throw new IllegalArgumentException("重复标题：" + task.title());
        }
        store.put(task.title(), task);
    }

    public Task find(String title) { return store.get(title); }

    public List<Task> all() { return new ArrayList<>(store.values()); }

    public boolean remove(String title) { return store.remove(title) != null; }
}`,
    },
    {
      name: "service/TaskQueries.java",
      note: "查询与统计：纯函数，方便单测",
      code: String.raw`package com.example.task.service;

import com.example.task.domain.Task;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;

public final class TaskQueries {
    private TaskQueries() {}

    public static List<Task> visible(List<Task> tasks, boolean includeDone) {
        List<Task> result = new ArrayList<>(tasks);
        result.removeIf(t -> !includeDone && t.isDone());
        result.sort(Comparator.comparingInt(Task::priority).thenComparing(Task::title));
        return result;
    }

    public static String report(List<Task> tasks) {
        if (tasks.isEmpty()) return "总计 0 | 完成 0 | 待办 0 | 完成率 0%";
        int total = tasks.size();
        int done = (int) tasks.stream().filter(Task::isDone).count();
        int rate = (int) Math.round(done * 100.0 / total);
        return String.format("总计 %d | 完成 %d | 待办 %d | 完成率 %d%%",
                total, done, total - done, rate);
    }
}`,
    },
    {
      name: "Main.java",
      note: "CLI 入口：只做参数解析与输出",
      code: String.raw`package com.example.task;

import com.example.task.domain.Task;
import com.example.task.repository.TaskRepository;
import com.example.task.service.TaskQueries;
import java.util.Scanner;

public class Main {
    public static void main(String[] args) {
        TaskRepository repo = new TaskRepository();
        repo.add(new Task("复习集合", 1));
        repo.add(new Task("写周报", 3));

        try (Scanner scanner = new Scanner(System.in)) {
            while (true) {
                System.out.println("1) 添加  2) 完成  3) 列表  0) 退出");
                String choice = scanner.nextLine().trim();
                if (choice.equals("0")) break;
                switch (choice) {
                    case "1" -> {
                        System.out.print("标题：");
                        String title = scanner.nextLine();
                        System.out.print("优先级 1-5：");
                        int priority = Integer.parseInt(scanner.nextLine().trim());
                        repo.add(new Task(title, priority));
                    }
                    case "2" -> {
                        System.out.print("要完成的标题：");
                        Task task = repo.find(scanner.nextLine().trim());
                        if (task != null) task.complete();
                    }
                    case "3" -> {
                        TaskQueries.visible(repo.all(), true)
                                .forEach(t -> System.out.println(
                                        (t.isDone() ? "[x] " : "[ ] ") + t.title() + " P" + t.priority()));
                        System.out.println(TaskQueries.report(repo.all()));
                    }
                    default -> System.out.println("未知命令");
                }
            }
        }
    }
}`,
    },
  ],
  localSetup: [
    "mkdir -p task-cli/src/main/java/com/example/task",
    "cp -r domain repository service Main.java 到对应目录（按 package 调整）",
    "javac -d out $(find src/main/java -name '*.java')",
    "java -cp out com.example.task.Main",
  ],
  localNotes: [
    "不依赖 Maven 也能跑；加上 pom.xml 后可用 mvn package 生成可执行 jar。",
    "把 Scanner 换成参数解析（--add、--done）就能变成脚本工具，逻辑层不用动。",
  ],
  extensions: [
    "持久化：新增 FileTaskRepository 实现同一接口，用 JSON 或 TSV 存盘。",
    "截止日期与逾期统计：给 Task 增加 LocalDate dueDate，报表增加逾期数。",
    "标签与搜索：增加 tags 集合，查询层支持按标签过滤。",
    "单元测试：用 JUnit 5 覆盖校验、重复标题、排序与报表边界。",
  ],
  refs: [
    { name: "Effective Java · 条目 17（最小化可变性）", url: "https://www.ituring.com.cn/search?q=Effective%20Java", why: "为什么要用 final 字段、把状态修改收口到方法。" },
    { name: "JavaGuide · 集合框架", url: "https://github.com/Snailclimb/JavaGuide", why: "LinkedHashMap 的顺序语义与 HashMap 的差异。" },
    { name: "JUnit 5 用户指南", url: "https://junit.org/junit5/docs/current/user-guide/", why: "给这四层补上真正的单元测试。" },
  ],
});
