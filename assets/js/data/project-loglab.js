/* 项目 02 · LogLab 日志分析
   解析 → 聚合 → TopN → 报表。练的是数据清洗与 Stream 聚合，而不是正则背模板。 */
window.PROJECTS = window.PROJECTS || [];
window.PROJECTS.push({
  id: "loglab",
  index: "02",
  type: "project",
  title: "LogLab 日志 ETL",
  subtitle: "解析、聚合与慢接口排行",
  summary:
    "把一行行应用日志变成可读的报表：解析时间/级别/来源/耗时，按级别统计平均耗时，找出最慢的服务，最后导出 CSV。每一步都能独立测试。",
  level: "中级项目",
  duration: "5–7 小时",
  mode: "core",
  modeLabel: "Stream / java.time",
  accent: "#6b4bc4",
  stack: ["java.time", "Stream", "Collectors", "CSV", "record"],
  resumeLine: "实现日志 ETL 流水线：解析、聚合、慢接口排行与 CSV 导出，核心逻辑可测试",
  resume: {
    keywords: ["ETL", "Stream", "java.time", "数据清洗", "CSV"],
    bullets: [
      "定义 LogEntry record 统一日志模型，解析器对缺字段、错格式的行返回 null 而不是让程序崩溃。",
      "用 Collectors.groupingBy + averagingInt 完成按级别的平均耗时统计。",
      "按来源聚合平均延迟并输出 Top N，处理并列排序，保证报表可复现。",
      "实现 CSV 转义（逗号、引号、换行），导出结果可直接用 Excel 打开。",
    ],
  },
  highlights: [
    "真实日志一定有坏行：解析失败要跳过并计数，而不是抛出异常中断整批处理。",
    "报表排序写死并列规则，避免每次跑出来的顺序不同。",
    "CSV 字段必须转义，否则消息里的逗号会把列撑坏。",
    "四个检查点覆盖 ETL 的四个阶段，可直接判题验证。",
  ],
  sections: [
    { type: "h", text: "流水线的四个阶段" },
    {
      type: "p",
      html: "读入 → 解析 → 聚合 → 输出。每个阶段都应该是独立函数：解析器只负责把字符串变成对象，聚合器只接收对象列表，报表只负责格式化。这样出问题时能立刻定位是哪一段。",
    },
    {
      type: "code",
      file: "log-sample.txt",
      lang: "text",
      plain: true,
      code: `2026-11-03 10:00:00 INFO order latency=120 创建订单成功
2026-11-03 10:00:01 WARN order latency=250 库存不足，降级处理
2026-11-03 10:00:02 ERROR payment latency=800 支付网关超时
2026-11-03 10:00:03 INFO search latency=45 查询商品
bad line without timestamp`,
    },
    { type: "h", text: "解析：先校验，再取值" },
    {
      type: "p",
      html: "日志解析最忌讳“抓到一个字段就开始 Integer.parseInt”。先用结构校验确认字段数量，再逐个解析；任何一步失败就返回 null 并记录坏行数。批量任务不能因为一行坏数据就整体失败。",
    },
    {
      type: "callout",
      tone: "warn",
      title: "时间格式与时区",
      html: "日志时间用 <code>LocalDateTime</code> 表示“本地时间”；如果需要跨时区排序或计算，应该带 ZoneOffset 用 <code>OffsetDateTime</code> / <code>Instant</code>。本项目统一按 <code>yyyy-MM-dd HH:mm:ss</code> 解析。",
    },
    { type: "h", text: "聚合：groupingBy 是主力" },
    {
      type: "code",
      file: "Aggregate.java",
      code: String.raw`Map<String, Double> avg = entries.stream()
    .collect(Collectors.groupingBy(
        LogEntry::level,
        Collectors.averagingInt(LogEntry::latencyMs)));`,
    },
    {
      type: "p",
      html: "同上，<code>averagingInt</code> 返回 double；<code>summingInt</code> 返回 int；<code>counting</code> 返回 long。注意 <code>groupingBy</code> 默认用 HashMap，报表顺序不稳定；需要稳定顺序时指定 <code>TreeMap::new</code> 或在输出前排序。",
    },
    { type: "h", text: "Top N：排序规则要可复现" },
    {
      type: "p",
      html: "按平均延迟降序；延迟相同按来源字典序升序。不要依赖 HashMap 的遍历顺序，否则同一批数据每次跑出来的榜单都不同，无法做前后对比。",
    },
    { type: "h", text: "CSV：逗号和引号必须转义" },
    {
      type: "list",
      items: [
        "字段包含逗号、双引号或换行时，整个字段用双引号包起来。",
        "字段里的双引号要写成两个双引号（<code>\"\"</code>）转义。",
        "表头固定，列顺序不要随版本变化，否则下游脚本全挂。",
        "用 UTF-8 写出，Excel 打开中文不乱码。",
      ],
    },
  ],
  architecture: {
    tree: `loglab/
├── src/main/java/com/example/loglab/
│   ├── Main.java              # 读文件 → 解析 → 聚合 → 写 CSV
│   ├── model/LogEntry.java    # record：时间、级别、来源、耗时、消息
│   ├── parse/LogParser.java   # 字符串 → LogEntry / null
│   └── analyze/LogAnalyzer.java  # 平均耗时、TopN、CSV
└── src/test/java/com/example/loglab/
    └── LogParserTest.java`,
    notes: [
      "解析器不打印日志、不读文件，只接收一行字符串，方便单测。",
      "聚合器只接收 List<LogEntry>，不关心数据来自文件还是网络。",
      "输出层负责 CSV 转义和文件写入，其他层不碰 IO。",
    ],
  },
  milestones: [
    { title: "M1 日志解析", desc: "把一行日志解析成 record，坏行返回 null。", exIds: ["pr2-1"] },
    { title: "M2 按级别聚合", desc: "统计每个级别的平均耗时。", exIds: ["pr2-2"] },
    { title: "M3 慢服务 TopN", desc: "按来源平均延迟排序，输出前 N 名。", exIds: ["pr2-3"] },
    { title: "M4 CSV 导出", desc: "生成表头 + 数据行，正确转义逗号和引号。", exIds: ["pr2-4"] },
  ],
  exercises: [
    {
      id: "pr2-1",
      kind: "code",
      title: "解析日志行",
      difficulty: "★★★",
      prompt:
        "实现 <code>parseLine(String line)</code>，格式为 <code>yyyy-MM-dd HH:mm:ss LEVEL source latency=毫秒 消息</code>，消息可以包含空格。解析成功返回 <code>LogEntry</code>；null、空行、字段缺失、时间/耗时格式错误都返回 null。",
      starter: String.raw`import java.time.*;

record LogEntry(LocalDateTime time, String level, String source, int latencyMs, String message) {}

public class Main {
    static LogEntry parseLine(String line) {
        // TODO
        return null;
    }

    public static void main(String[] args) {
        System.out.println(parseLine("2026-11-03 10:00:00 INFO order latency=120 创建订单成功"));
    }
}`,
      hints: [
        "用 <code>line.split(\" \", 5)</code> 切成 5 段：日期、时间、级别、来源、剩余部分。",
        "剩余部分形如 <code>latency=120 消息</code>，用第一个空格分开。",
        "解析失败统一返回 null，不要抛异常给调用方。",
      ],
      solution: String.raw`import java.time.*;

record LogEntry(LocalDateTime time, String level, String source, int latencyMs, String message) {}

public class Main {
    static LogEntry parseLine(String line) {
        if (line == null || line.isBlank()) return null;
        String[] parts = line.trim().split(" ", 5);
        if (parts.length < 5) return null;
        try {
            LocalDateTime time = LocalDateTime.parse(parts[0] + "T" + parts[1]);
            String level = parts[2];
            String source = parts[3];
            String rest = parts[4];
            int space = rest.indexOf(' ');
            if (space < 0) return null;
            String latencyToken = rest.substring(0, space);
            if (!latencyToken.startsWith("latency=")) return null;
            int latency = Integer.parseInt(latencyToken.substring("latency=".length()));
            String message = rest.substring(space + 1);
            if (level.isBlank() || source.isBlank() || message.isBlank()) return null;
            return new LogEntry(time, level, source, latency, message);
        } catch (RuntimeException e) {
            return null;
        }
    }

    public static void main(String[] args) {
        System.out.println(parseLine("2026-11-03 10:00:00 INFO order latency=120 创建订单成功"));
    }
}`,
      check: String.raw`        LogEntry e = Main.parseLine("2026-11-03 10:00:00 INFO order latency=120 创建订单成功");
        check(e != null, "合法行应解析成功");
        eq(e.time(), LocalDateTime.of(2026, 11, 3, 10, 0, 0), "时间解析错误");
        eq(e.level(), "INFO", "级别");
        eq(e.source(), "order", "来源");
        eq(e.latencyMs(), 120, "耗时");
        eq(e.message(), "创建订单成功", "消息可以包含中文与空格");

        String[] bad = {null, "", "   ", "2026-11-03 10:00:00 INFO order 创建订单成功",
                        "2026-11-03 10:00:00 INFO order latency=abc 消息",
                        "2026/11/03 10:00:00 INFO order latency=120 消息"};
        for (String b : bad) check(Main.parseLine(b) == null, "坏行应返回 null：" + b);`,
    },
    {
      id: "pr2-2",
      kind: "code",
      title: "按级别统计平均耗时",
      difficulty: "★★☆",
      prompt:
        "实现 <code>avgLatencyByLevel(List&lt;LogEntry&gt; entries)</code>，返回每个级别的平均耗时（毫秒，double）。null 或空列表返回空 Map。",
      starter: String.raw`import java.time.*;
import java.util.*;
import java.util.stream.*;

record LogEntry(LocalDateTime time, String level, String source, int latencyMs, String message) {}

public class Main {
    static Map<String, Double> avgLatencyByLevel(List<LogEntry> entries) {
        // TODO: groupingBy + averagingInt
        return Map.of();
    }

    public static void main(String[] args) {
        System.out.println(avgLatencyByLevel(List.of()));
    }
}`,
      hints: [
        "<code>Collectors.groupingBy(LogEntry::level, Collectors.averagingInt(LogEntry::latencyMs))</code>。",
        "先判空再 stream，避免空指针。",
      ],
      solution: String.raw`import java.time.*;
import java.util.*;
import java.util.stream.*;

record LogEntry(LocalDateTime time, String level, String source, int latencyMs, String message) {}

public class Main {
    static Map<String, Double> avgLatencyByLevel(List<LogEntry> entries) {
        if (entries == null || entries.isEmpty()) return Map.of();
        return entries.stream().collect(
            Collectors.groupingBy(LogEntry::level,
                Collectors.averagingInt(LogEntry::latencyMs)));
    }

    public static void main(String[] args) {
        System.out.println(avgLatencyByLevel(List.of()));
    }
}`,
      check: String.raw`        LocalDateTime t = LocalDateTime.of(2026, 11, 3, 10, 0);
        List<LogEntry> entries = List.of(
            new LogEntry(t, "INFO", "order", 100, "a"),
            new LogEntry(t, "INFO", "search", 60, "b"),
            new LogEntry(t, "ERROR", "payment", 800, "c"),
            new LogEntry(t, "WARN", "order", 240, "d"));
        Map<String, Double> avg = Main.avgLatencyByLevel(entries);
        eq(avg.size(), 3, "应有 INFO/WARN/ERROR 三个级别");
        near(avg.get("INFO"), 80.0, 0.0001, "INFO 平均耗时");
        near(avg.get("ERROR"), 800.0, 0.0001, "ERROR 平均耗时");
        near(avg.get("WARN"), 240.0, 0.0001, "WARN 平均耗时");
        check(Main.avgLatencyByLevel(null).isEmpty(), "null 返回空 Map");`,
    },
    {
      id: "pr2-3",
      kind: "code",
      title: "慢服务 Top N",
      difficulty: "★★★",
      prompt:
        "实现 <code>slowestSources(List&lt;LogEntry&gt; entries, int n)</code>：按来源计算平均耗时，按平均值降序；相同平均值按来源字典序升序。返回前 n 个来源名。n 小于等于 0 或列表为空返回空列表。",
      starter: String.raw`import java.time.*;
import java.util.*;
import java.util.stream.*;

record LogEntry(LocalDateTime time, String level, String source, int latencyMs, String message) {}

public class Main {
    static List<String> slowestSources(List<LogEntry> entries, int n) {
        // TODO
        return List.of();
    }

    public static void main(String[] args) {
        System.out.println(slowestSources(List.of(), 3));
    }
}`,
      hints: [
        "先按 source 求平均：<code>groupingBy(LogEntry::source, averagingInt(...))</code>。",
        "把 entrySet 排序：<code>comparingByValue().reversed().thenComparing(comparingByKey())</code>。",
        "截取用 <code>Math.min(n, size)</code>。",
      ],
      solution: String.raw`import java.time.*;
import java.util.*;
import java.util.stream.*;

record LogEntry(LocalDateTime time, String level, String source, int latencyMs, String message) {}

public class Main {
    static List<String> slowestSources(List<LogEntry> entries, int n) {
        if (entries == null || entries.isEmpty() || n <= 0) return List.of();
        Map<String, Double> avg = entries.stream().collect(
            Collectors.groupingBy(LogEntry::source,
                Collectors.averagingInt(LogEntry::latencyMs)));

        List<Map.Entry<String, Double>> list = new ArrayList<>(avg.entrySet());
        list.sort(Map.Entry.<String, Double>comparingByValue().reversed()
                .thenComparing(Map.Entry.comparingByKey()));

        List<String> result = new ArrayList<>();
        for (int i = 0; i < Math.min(n, list.size()); i++) {
            result.add(list.get(i).getKey());
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(slowestSources(List.of(), 3));
    }
}`,
      check: String.raw`        LocalDateTime t = LocalDateTime.of(2026, 11, 3, 10, 0);
        List<LogEntry> entries = List.of(
            new LogEntry(t, "INFO", "order", 100, "a"),
            new LogEntry(t, "WARN", "order", 300, "b"),
            new LogEntry(t, "INFO", "payment", 800, "c"),
            new LogEntry(t, "INFO", "search", 200, "d"),
            new LogEntry(t, "INFO", "search", 200, "e"));
        eq(Main.slowestSources(entries, 2), List.of("payment", "order"), "payment 800 第一；order 与 search 均 200，按字典序 order 在前");
        eq(Main.slowestSources(entries, 3), List.of("payment", "order", "search"), "前三名");
        eq(Main.slowestSources(entries, 0), List.of(), "n=0 返回空");
        eq(Main.slowestSources(entries, 10).size(), 3, "n 超长时返回全部来源");`,
    },
    {
      id: "pr2-4",
      kind: "code",
      title: "导出 CSV",
      difficulty: "★★★",
      prompt:
        "实现 <code>toCsv(List&lt;LogEntry&gt; entries)</code>：第一行表头 <code>time,level,source,latencyMs,message</code>，之后每行一个日志。时间格式 <code>yyyy-MM-dd HH:mm:ss</code>。字段包含逗号、双引号或换行时用双引号包裹，内部双引号写成两个。返回完整字符串（不含末尾换行），空列表只返回表头。",
      starter: String.raw`import java.time.*;
import java.time.format.*;
import java.util.*;

record LogEntry(LocalDateTime time, String level, String source, int latencyMs, String message) {}

public class Main {
    static String toCsv(List<LogEntry> entries) {
        // TODO
        return "";
    }

    public static void main(String[] args) {
        System.out.println(toCsv(List.of()));
    }
}`,
      hints: [
        "写一个 <code>escape(String s)</code>：需要时返回 <code>\"\"\" + s.replace(\"\\\"\", \"\\\"\\\"\") + \"\"\"</code>。",
        "时间用 <code>DateTimeFormatter.ofPattern(\"yyyy-MM-dd HH:mm:ss\")</code>。",
        "用 StringBuilder 逐行 append，最后 <code>stripTrailing()</code> 或手动控制换行。",
      ],
      solution: String.raw`import java.time.*;
import java.time.format.*;
import java.util.*;

record LogEntry(LocalDateTime time, String level, String source, int latencyMs, String message) {}

public class Main {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");

    static String escape(String s) {
        if (s == null) s = "";
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }

    static String toCsv(List<LogEntry> entries) {
        StringBuilder sb = new StringBuilder("time,level,source,latencyMs,message");
        if (entries == null) return sb.toString();
        for (LogEntry e : entries) {
            sb.append("\n")
              .append(escape(e.time().format(FMT))).append(",")
              .append(escape(e.level())).append(",")
              .append(escape(e.source())).append(",")
              .append(e.latencyMs()).append(",")
              .append(escape(e.message()));
        }
        return sb.toString();
    }

    public static void main(String[] args) {
        System.out.println(toCsv(List.of()));
    }
}`,
      check: String.raw`        LocalDateTime t = LocalDateTime.of(2026, 11, 3, 10, 0, 0);
        eq(Main.toCsv(List.of()), "time,level,source,latencyMs,message", "空列表只返回表头");
        String csv = Main.toCsv(List.of(new LogEntry(t, "INFO", "order", 120, "创建订单成功")));
        eq(csv, "time,level,source,latencyMs,message\n2026-11-03 10:00:00,INFO,order,120,创建订单成功", "单行 CSV");
        String tricky = Main.toCsv(List.of(new LogEntry(t, "WARN", "order", 50, "库存不足, 已降级")));
        check(tricky.contains("\"库存不足, 已降级\""), "包含逗号的字段应被引号包裹");
        String quote = Main.toCsv(List.of(new LogEntry(t, "ERROR", "pay", 1, "他说\"超时\"")));
        check(quote.contains("\"他说\"\"超时\"\"\""), "内部双引号应写成两个");`,
    },
  ],
  files: [
    {
      name: "model/LogEntry.java",
      note: "record 统一日志模型",
      code: String.raw`package com.example.loglab.model;

import java.time.LocalDateTime;

public record LogEntry(
        LocalDateTime time,
        String level,
        String source,
        int latencyMs,
        String message) {
}`,
    },
    {
      name: "parse/LogParser.java",
      note: "坏行返回 null，批量任务不中断",
      code: String.raw`package com.example.loglab.parse;

import com.example.loglab.model.LogEntry;
import java.time.LocalDateTime;

public final class LogParser {
    private LogParser() {}

    public static LogEntry parse(String line) {
        if (line == null || line.isBlank()) return null;
        String[] parts = line.trim().split(" ", 5);
        if (parts.length < 5) return null;

        try {
            LocalDateTime time = LocalDateTime.parse(parts[0] + "T" + parts[1]);
            String rest = parts[4];
            int space = rest.indexOf(' ');
            if (space < 0 || !rest.startsWith("latency=")) return null;

            int latency = Integer.parseInt(rest.substring("latency=".length(), space));
            String message = rest.substring(space + 1);
            if (message.isBlank()) return null;

            return new LogEntry(time, parts[2], parts[3], latency, message);
        } catch (RuntimeException e) {
            return null;
        }
    }
}`,
    },
    {
      name: "analyze/LogAnalyzer.java",
      note: "聚合、TopN、CSV 输出",
      code: String.raw`package com.example.loglab.analyze;

import com.example.loglab.model.LogEntry;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.stream.Collectors;

public final class LogAnalyzer {
    private static final DateTimeFormatter FMT = DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss");
    private LogAnalyzer() {}

    public static Map<String, Double> avgByLevel(List<LogEntry> entries) {
        return entries.stream().collect(Collectors.groupingBy(
                LogEntry::level,
                Collectors.averagingInt(LogEntry::latencyMs)));
    }

    public static List<String> slowest(List<LogEntry> entries, int n) {
        Map<String, Double> avg = entries.stream().collect(Collectors.groupingBy(
                LogEntry::source,
                Collectors.averagingInt(LogEntry::latencyMs)));
        return avg.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed()
                        .thenComparing(Map.Entry.comparingByKey()))
                .limit(Math.max(0, n))
                .map(Map.Entry::getKey)
                .collect(Collectors.toList());
    }

    public static String toCsv(List<LogEntry> entries) {
        StringBuilder sb = new StringBuilder("time,level,source,latencyMs,message");
        for (LogEntry e : entries) {
            sb.append('\n')
              .append(escape(e.time().format(FMT))).append(',')
              .append(escape(e.level())).append(',')
              .append(escape(e.source())).append(',')
              .append(e.latencyMs()).append(',')
              .append(escape(e.message()));
        }
        return sb.toString();
    }

    private static String escape(String value) {
        String s = value == null ? "" : value;
        if (s.contains(",") || s.contains("\"") || s.contains("\n")) {
            return "\"" + s.replace("\"", "\"\"") + "\"";
        }
        return s;
    }
}`,
    },
    {
      name: "Main.java",
      note: "串联 ETL：跳过坏行并统计",
      code: String.raw`package com.example.loglab;

import com.example.loglab.analyze.LogAnalyzer;
import com.example.loglab.model.LogEntry;
import com.example.loglab.parse.LogParser;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.ArrayList;
import java.util.List;

public class Main {
    public static void main(String[] args) throws Exception {
        List<String> lines = Files.readAllLines(Path.of("app.log"));
        List<LogEntry> entries = new ArrayList<>();
        int skipped = 0;

        for (String line : lines) {
            LogEntry entry = LogParser.parse(line);
            if (entry == null) skipped++;
            else entries.add(entry);
        }

        System.out.println("有效 " + entries.size() + " 行，跳过 " + skipped + " 行");
        System.out.println("按级别平均耗时：" + LogAnalyzer.avgByLevel(entries));
        System.out.println("最慢来源：" + LogAnalyzer.slowest(entries, 3));
        Files.writeString(Path.of("report.csv"), LogAnalyzer.toCsv(entries));
    }
}`,
    },
  ],
  localSetup: [
    "mkdir -p loglab/src/main/java/com/example/loglab",
    "把 4 个参考文件放进对应包目录",
    "javac -d out $(find src/main/java -name '*.java')",
    "java -cp out com.example.loglab.Main",
  ],
  localNotes: [
    "准备一个 app.log，每行按项目格式写；坏行会出现在“跳过”计数里。",
    "report.csv 用 Excel 打开即可看到中文；字段里的逗号已被正确转义。",
  ],
  extensions: [
    "流式处理：用 Files.lines 逐行读取，避免大文件一次性进内存。",
    "按时间窗口聚合：每 5 分钟一个桶，统计错误率。",
    "接入真实日志：支持正则提取 traceId，按链路追踪耗时。",
    "命令行参数：--input、--top、--output，用第三章的参数解析练习改写。",
  ],
  refs: [
    { name: "Java 核心技术 卷 II · 流与文件", url: "https://www.ituring.com.cn/search?q=Java核心技术", why: "Files、编码、CSV 写出的标准做法。" },
    { name: "GitHub: Snailclimb/JavaGuide · Stream", url: "https://github.com/Snailclimb/JavaGuide", why: "Collectors 分组、聚合、排序的系统示例。" },
    { name: "Effective Java · 条目 45（谨慎使用 Stream）", url: "https://www.ituring.com.cn/search?q=Effective%20Java", why: "什么时候该用循环而不是硬套 Stream。" },
  ],
});
