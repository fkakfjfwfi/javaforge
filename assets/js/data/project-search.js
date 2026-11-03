/* 项目 03 · MiniSearch 迷你搜索引擎
   分词 → 倒排索引 → TF-IDF 打分 → 排序。练的是“把算法写成可测试的小函数”。 */
window.PROJECTS = window.PROJECTS || [];
window.PROJECTS.push({
  id: "mini-search",
  index: "03",
  type: "project",
  title: "MiniSearch 迷你搜索引擎",
  subtitle: "倒排索引与 TF-IDF 排序",
  summary:
    "用不到 150 行核心代码实现一个可解释的搜索：分词、建立 term → 文档的倒排索引、用 TF-IDF 打分、按分数与文档 ID 稳定排序。",
  level: "进阶项目",
  duration: "6–8 小时",
  mode: "core",
  modeLabel: "算法 / 集合",
  accent: "#157066",
  stack: ["倒排索引", "TF-IDF", "Map/Set", "Stream", "排序"],
  resumeLine: "实现基于倒排索引与 TF-IDF 的迷你搜索引擎，支持多词查询与稳定排序",
  resume: {
    keywords: ["倒排索引", "TF-IDF", "文本处理", "排序稳定性", "复杂度分析"],
    bullets: [
      "实现英文分词与倒排索引，term → 文档 ID 集合，查询时避免全量扫描。",
      "实现 TF-IDF 打分：词频归一化 + 逆文档频率，解释每个分数如何计算。",
      "多词查询按文档累加分数，按分数降序、文档 ID 升序稳定排序。",
      "用 record 与不可变集合组织数据，核心函数全部可单独测试。",
    ],
  },
  highlights: [
    "倒排索引是搜索引擎、日志检索、电商搜索的共同基础。",
    "TF-IDF 不玄学：TF 是词频，IDF 衡量词有多稀有，两者相乘。",
    "排序一定要有第二关键字，否则同分文档顺序不可复现。",
    "四个检查点从分词到搜索，难度递进，适合写进简历讲清楚。",
  ],
  sections: [
    { type: "h", text: "为什么需要倒排索引" },
    {
      type: "p",
      html: "正排索引是“文档 → 包含的词”，查询时要遍历所有文档。倒排索引反过来：<code>词 → 包含它的文档集合</code>。查询 <code>java</code> 时直接拿到候选文档，不用扫描全库。",
    },
    {
      type: "code",
      file: "index.json",
      lang: "json",
      plain: true,
      code: `{
  "java":   ["d1", "d2"],
  "stream": ["d1"],
  "lambda": ["d2"],
  "python": ["d3"]
}`,
    },
    { type: "h", text: "TF-IDF：一个可解释的打分公式" },
    {
      type: "table",
      head: ["符号", "含义", "公式"],
      rows: [
        ["TF", "词在文档中的频率", "该词出现次数 / 文档总词数"],
        ["DF", "包含该词的文档数", "统计倒排索引的集合大小"],
        ["IDF", "逆文档频率（越稀有越大）", "ln((N + 1) / (DF + 1)) + 1"],
        ["TF-IDF", "综合得分", "TF × IDF"],
      ],
    },
    {
      type: "callout",
      tone: "deep",
      title: "为什么 IDF 要加 1",
      html: "如果某个词在所有文档都出现，<code>N / DF = 1</code>，<code>ln(1) = 0</code>，这个词就完全不影响排序——这是合理的（比如 the、的）。加 1 是为了避免 DF 为 0 时除零，并让 IDF 始终为正。",
    },
    { type: "h", text: "查询：把多个词的分数加起来" },
    {
      type: "code",
      file: "score.java",
      lang: "java",
      code: String.raw`for (String term : queryTerms) {
    for (String docId : index.getOrDefault(term, Set.of())) {
        scores.merge(docId, tfidf(term, doc, corpus), Double::sum);
    }
}`,
    },
    {
      type: "p",
      html: "只遍历命中的文档，而不是所有文档，这是倒排索引带来的第一层加速。真实搜索引擎还会做短语匹配、同义词扩展、BM25 归一化和分片，但骨架就是这一套。",
    },
    { type: "h", text: "排序稳定性" },
    {
      type: "list",
      items: [
        "分数降序：用户最想看的在前面。",
        "同分按文档 ID 升序：保证同一查询每次结果一致，方便测试和对比。",
        "不要用 <code>HashMap</code> 的遍历顺序决定排名。",
        "取 Top K 时先过滤 0 分文档，避免把无关文档塞进结果。",
      ],
    },
    { type: "h", text: "这个实现的边界" },
    {
      type: "list",
      items: [
        "只支持英文/数字分词；中文需要分词器（HanLP、jieba）或二元切分。",
        "没有停用词表，the、a 会进入索引，但 IDF 会自然压低它们的权重。",
        "没有词干化：java 与 javaes 会被当成两个词。",
        "数据全在内存，适合学习与中小规模检索，不是 Elasticsearch 替代品。",
      ],
    },
  ],
  architecture: {
    tree: `mini-search/
├── src/main/java/com/example/search/
│   ├── Main.java                 # 加载文档、建索引、执行查询
│   ├── model/Document.java       # record(id, text)
│   ├── index/Tokenizer.java      # 小写 + 非字母数字切分
│   ├── index/InvertedIndex.java  # term → Set<docId>
│   └── rank/TfIdfRanker.java     # 打分与 TopK
└── src/test/java/com/example/search/
    └── TfIdfRankerTest.java`,
    notes: [
      "分词器是纯函数，输入字符串输出词列表。",
      "索引构建只依赖文档列表，不依赖查询。",
      "打分器接收查询词、文档、语料，返回分数；TopK 只负责排序与截取。",
    ],
  },
  milestones: [
    { title: "M1 分词", desc: "统一小写、按非字母数字切分、过滤空串。", exIds: ["pr3-1"] },
    { title: "M2 倒排索引", desc: "term → 文档 ID 集合，文档 ID 排序稳定。", exIds: ["pr3-2"] },
    { title: "M3 TF-IDF 打分", desc: "实现 TF、IDF 与单词语料得分。", exIds: ["pr3-3"] },
    { title: "M4 查询 TopK", desc: "多词累加、过滤零分、稳定排序。", exIds: ["pr3-4"] },
  ],
  exercises: [
    {
      id: "pr3-1",
      kind: "code",
      title: "英文分词",
      difficulty: "★★☆",
      prompt:
        "实现 <code>tokenize(String text)</code>：转小写，按任意非字母数字字符切分，过滤空串。null 或空白返回空列表。例如 <code>\"Java, Stream! Stream.\"</code> 返回 <code>[java, stream, stream]</code>。",
      starter: String.raw`import java.util.*;

public class Main {
    static List<String> tokenize(String text) {
        // TODO
        return List.of();
    }

    public static void main(String[] args) {
        System.out.println(tokenize("Java, Stream! Stream."));
    }
}`,
      hints: [
        "<code>text.toLowerCase().split(\"[^a-z0-9]+\")</code>。",
        "split 结果可能包含空串，遍历过滤 <code>!w.isBlank()</code>。",
      ],
      solution: String.raw`import java.util.*;

public class Main {
    static List<String> tokenize(String text) {
        List<String> tokens = new ArrayList<>();
        if (text == null || text.isBlank()) return tokens;
        for (String part : text.toLowerCase().split("[^a-z0-9]+")) {
            if (!part.isBlank()) tokens.add(part);
        }
        return tokens;
    }

    public static void main(String[] args) {
        System.out.println(tokenize("Java, Stream! Stream."));
    }
}`,
      check: String.raw`        eq(Main.tokenize("Java, Stream! Stream."), List.of("java", "stream", "stream"), "标点应被切掉，单词小写");
        eq(Main.tokenize("Hello-world 2026"), List.of("hello", "world", "2026"), "连字符与数字");
        eq(Main.tokenize(null), List.of(), "null 返回空列表");
        eq(Main.tokenize("   "), List.of(), "空白返回空列表");
        eq(Main.tokenize("!!!..."), List.of(), "只有标点返回空列表");`,
    },
    {
      id: "pr3-2",
      kind: "code",
      title: "构建倒排索引",
      difficulty: "★★★",
      prompt:
        "实现 <code>buildIndex(List&lt;Document&gt; docs)</code>，返回 <code>Map&lt;String, Set&lt;String&gt;&gt;</code>：每个词映射到包含它的文档 ID 集合。文档 ID 集合用 <code>TreeSet</code> 保证顺序。null 或空列表返回空 Map。",
      starter: String.raw`import java.util.*;

record Document(String id, String text) {}

public class Main {
    static Map<String, Set<String>> buildIndex(List<Document> docs) {
        // TODO
        return Map.of();
    }

    public static void main(String[] args) {
        System.out.println(buildIndex(List.of(new Document("d1", "java stream"))));
    }
}`,
      hints: [
        "<code>Map&lt;String, Set&lt;String&gt;&gt; index = new TreeMap&lt;&gt;()</code>。",
        "每个文档先 <code>tokenize</code>，再用 <code>computeIfAbsent</code> 建集合。",
        "用 <code>new TreeSet&lt;&gt;()</code> 存文档 ID，避免重复且顺序稳定。",
      ],
      solution: String.raw`import java.util.*;

record Document(String id, String text) {}

public class Main {
    static List<String> tokenize(String text) {
        List<String> tokens = new ArrayList<>();
        if (text == null || text.isBlank()) return tokens;
        for (String part : text.toLowerCase().split("[^a-z0-9]+")) {
            if (!part.isBlank()) tokens.add(part);
        }
        return tokens;
    }

    static Map<String, Set<String>> buildIndex(List<Document> docs) {
        Map<String, Set<String>> index = new TreeMap<>();
        if (docs == null) return index;
        for (Document doc : docs) {
            for (String term : tokenize(doc.text())) {
                index.computeIfAbsent(term, k -> new TreeSet<>()).add(doc.id());
            }
        }
        return index;
    }

    public static void main(String[] args) {
        System.out.println(buildIndex(List.of(new Document("d1", "java stream"))));
    }
}`,
      check: String.raw`        List<Document> docs = List.of(
            new Document("d1", "java stream stream"),
            new Document("d2", "java lambda"),
            new Document("d3", "python data"));
        Map<String, Set<String>> index = Main.buildIndex(docs);
        eq(index.get("java"), Set.of("d1", "d2"), "java 应命中 d1、d2");
        eq(index.get("stream"), Set.of("d1"), "stream 只命中 d1");
        eq(index.get("python"), Set.of("d3"), "python 只命中 d3");
        check(!index.containsKey("missing"), "不存在的词不应有键");
        check(Main.buildIndex(null).isEmpty(), "null 返回空 Map");`,
    },
    {
      id: "pr3-3",
      kind: "code",
      title: "TF-IDF 单词得分",
      difficulty: "★★★",
      prompt:
        "实现 <code>tfidf(String term, Document doc, List&lt;Document&gt; corpus)</code>：TF = 该词在文档中出现次数 / 文档总词数；IDF = ln((N + 1) / (DF + 1)) + 1，其中 N 是语料文档数，DF 是包含该词的文档数。返回 TF × IDF；词不在文档中返回 0。",
      starter: String.raw`import java.util.*;

record Document(String id, String text) {}

public class Main {
    static List<String> tokenize(String text) { /* 已实现 */ 
        List<String> tokens = new ArrayList<>();
        if (text == null || text.isBlank()) return tokens;
        for (String part : text.toLowerCase().split("[^a-z0-9]+")) {
            if (!part.isBlank()) tokens.add(part);
        }
        return tokens;
    }

    static double tfidf(String term, Document doc, List<Document> corpus) {
        // TODO
        return 0;
    }

    public static void main(String[] args) {
        List<Document> corpus = List.of(
            new Document("d1", "java stream stream"),
            new Document("d2", "java lambda"));
        System.out.println(tfidf("stream", corpus.get(0), corpus));
    }
}`,
      hints: [
        "先 <code>tokenize(doc.text())</code>，统计 term 出现次数与总词数。",
        "DF 遍历 corpus，统计有多少文档包含 term。",
        "Tn 为空返回 0；DF 为 0 时同样 TF 为 0，可以直接返回 0。",
      ],
      solution: String.raw`import java.util.*;

record Document(String id, String text) {}

public class Main {
    static List<String> tokenize(String text) {
        List<String> tokens = new ArrayList<>();
        if (text == null || text.isBlank()) return tokens;
        for (String part : text.toLowerCase().split("[^a-z0-9]+")) {
            if (!part.isBlank()) tokens.add(part);
        }
        return tokens;
    }

    static double tfidf(String term, Document doc, List<Document> corpus) {
        if (term == null || doc == null || corpus == null || corpus.isEmpty()) return 0;
        String keyword = term.toLowerCase();
        List<String> tokens = tokenize(doc.text());
        if (tokens.isEmpty()) return 0;

        int occurrences = 0;
        for (String t : tokens) if (t.equals(keyword)) occurrences++;
        if (occurrences == 0) return 0;

        double tf = (double) occurrences / tokens.size();
        int df = 0;
        for (Document d : corpus) {
            if (tokenize(d.text()).contains(keyword)) df++;
        }
        double idf = Math.log((corpus.size() + 1.0) / (df + 1.0)) + 1.0;
        return tf * idf;
    }

    public static void main(String[] args) {
        List<Document> corpus = List.of(
            new Document("d1", "java stream stream"),
            new Document("d2", "java lambda"));
        System.out.println(tfidf("stream", corpus.get(0), corpus));
    }
}`,
      check: String.raw`        List<Document> corpus = List.of(
            new Document("d1", "java stream stream"),
            new Document("d2", "java lambda"),
            new Document("d3", "python data"));
        double expectedStream = (2.0 / 3.0) * (Math.log(4.0 / 2.0) + 1.0);
        near(Main.tfidf("stream", corpus.get(0), corpus), expectedStream, 1e-9, "stream 的 TF-IDF");
        double expectedJava = (1.0 / 3.0) * (Math.log(4.0 / 3.0) + 1.0);
        near(Main.tfidf("java", corpus.get(0), corpus), expectedJava, 1e-9, "java 的 TF-IDF");
        near(Main.tfidf("python", corpus.get(0), corpus), 0.0, 1e-9, "文档不含该词应返回 0");
        near(Main.tfidf("python", corpus.get(2), corpus), (0.5) * (Math.log(4.0 / 2.0) + 1.0), 1e-9, "d3 中 python 得分");`,
    },
    {
      id: "pr3-4",
      kind: "code",
      title: "多词查询与 Top K",
      difficulty: "★★★",
      prompt:
        "实现 <code>search(String query, List&lt;Document&gt; docs, int k)</code>：对查询分词并去重，每个词给命中文档累加 TF-IDF 分数，过滤 0 分，按分数降序、文档 ID 升序排序，返回前 k 个文档 ID。null/空查询、k≤0 返回空列表。",
      starter: String.raw`import java.util.*;

record Document(String id, String text) {}

public class Main {
    static List<String> tokenize(String text) { /* 已实现 */ 
        List<String> tokens = new ArrayList<>();
        if (text == null || text.isBlank()) return tokens;
        for (String part : text.toLowerCase().split("[^a-z0-9]+")) {
            if (!part.isBlank()) tokens.add(part);
        }
        return tokens;
    }

    static double tfidf(String term, Document doc, List<Document> corpus) {
        // 提示：直接用已通过的 TF-IDF 实现，或在这里补全
        return 0;
    }

    static List<String> search(String query, List<Document> docs, int k) {
        // TODO
        return List.of();
    }

    public static void main(String[] args) {
        System.out.println(search("java stream", List.of(), 3));
    }
}`,
      hints: [
        "对每个文档、每个查询词累加 <code>tfidf(term, doc, docs)</code>。",
        "排序：<code>comparingByValue().reversed().thenComparing(comparingByKey())</code>。",
        "用 <code>distinct()</code> 去掉重复查询词，避免同一个词重复加分。",
      ],
      solution: String.raw`import java.util.*;

record Document(String id, String text) {}

public class Main {
    static List<String> tokenize(String text) {
        List<String> tokens = new ArrayList<>();
        if (text == null || text.isBlank()) return tokens;
        for (String part : text.toLowerCase().split("[^a-z0-9]+")) {
            if (!part.isBlank()) tokens.add(part);
        }
        return tokens;
    }

    static double tfidf(String term, Document doc, List<Document> corpus) {
        if (term == null || doc == null || corpus == null || corpus.isEmpty()) return 0;
        String keyword = term.toLowerCase();
        List<String> tokens = tokenize(doc.text());
        if (tokens.isEmpty()) return 0;

        int occurrences = 0;
        for (String t : tokens) if (t.equals(keyword)) occurrences++;
        if (occurrences == 0) return 0;

        double tf = (double) occurrences / tokens.size();
        int df = 0;
        for (Document d : corpus) if (tokenize(d.text()).contains(keyword)) df++;
        double idf = Math.log((corpus.size() + 1.0) / (df + 1.0)) + 1.0;
        return tf * idf;
    }

    static List<String> search(String query, List<Document> docs, int k) {
        if (docs == null || docs.isEmpty() || k <= 0) return List.of();
        List<String> terms = new ArrayList<>(new LinkedHashSet<>(tokenize(query)));
        if (terms.isEmpty()) return List.of();

        Map<String, Double> scores = new HashMap<>();
        for (Document doc : docs) {
            double score = 0;
            for (String term : terms) score += tfidf(term, doc, docs);
            if (score > 0) scores.put(doc.id(), score);
        }

        List<Map.Entry<String, Double>> ranked = new ArrayList<>(scores.entrySet());
        ranked.sort(Map.Entry.<String, Double>comparingByValue().reversed()
                .thenComparing(Map.Entry.comparingByKey()));

        List<String> result = new ArrayList<>();
        for (int i = 0; i < Math.min(k, ranked.size()); i++) {
            result.add(ranked.get(i).getKey());
        }
        return result;
    }

    public static void main(String[] args) {
        System.out.println(search("java stream", List.of(), 3));
    }
}`,
      check: String.raw`        List<Document> docs = List.of(
            new Document("d1", "java stream stream"),
            new Document("d2", "java lambda"),
            new Document("d3", "python data"));
        eq(Main.search("java stream", docs, 2), List.of("d1", "d2"), "d1 命中两个词应排第一");
        eq(Main.search("java", docs, 2), List.of("d2", "d1"), "d2 的 java 词频更高");
        eq(Main.search("python", docs, 1), List.of("d3"), "python 只命中 d3");
        eq(Main.search("unknown", docs, 3), List.of(), "无命中的查询返回空列表");
        eq(Main.search("", docs, 3), List.of(), "空查询返回空列表");
        eq(Main.search("java", docs, 0), List.of(), "k=0 返回空列表");`,
    },
  ],
  files: [
    {
      name: "model/Document.java",
      note: "文档模型",
      code: String.raw`package com.example.search.model;

public record Document(String id, String text) {
}`,
    },
    {
      name: "index/Tokenizer.java",
      note: "小写 + 非字母数字切分",
      code: String.raw`package com.example.search.index;

import java.util.ArrayList;
import java.util.List;

public final class Tokenizer {
    private Tokenizer() {}

    public static List<String> tokenize(String text) {
        List<String> tokens = new ArrayList<>();
        if (text == null || text.isBlank()) return tokens;
        for (String part : text.toLowerCase().split("[^a-z0-9]+")) {
            if (!part.isBlank()) tokens.add(part);
        }
        return tokens;
    }
}`,
    },
    {
      name: "index/InvertedIndex.java",
      note: "term → 文档 ID 集合",
      code: String.raw`package com.example.search.index;

import com.example.search.model.Document;
import java.util.*;

public final class InvertedIndex {
    private final Map<String, Set<String>> index = new TreeMap<>();

    public void addAll(List<Document> docs) {
        for (Document doc : docs) {
            for (String term : Tokenizer.tokenize(doc.text())) {
                index.computeIfAbsent(term, k -> new TreeSet<>()).add(doc.id());
            }
        }
    }

    public Set<String> lookup(String term) {
        return index.getOrDefault(term, Set.of());
    }

    public Map<String, Set<String>> asMap() {
        return Collections.unmodifiableMap(index);
    }
}`,
    },
    {
      name: "rank/TfIdfRanker.java",
      note: "打分与 TopK，排序规则写死",
      code: String.raw`package com.example.search.rank;

import com.example.search.index.Tokenizer;
import com.example.search.model.Document;
import java.util.*;

public final class TfIdfRanker {
    private final List<Document> corpus;

    public TfIdfRanker(List<Document> corpus) {
        this.corpus = List.copyOf(corpus);
    }

    public double score(String term, Document doc) {
        List<String> tokens = Tokenizer.tokenize(doc.text());
        if (tokens.isEmpty()) return 0;

        int occurrences = Collections.frequency(tokens, term);
        if (occurrences == 0) return 0;

        double tf = (double) occurrences / tokens.size();
        int df = 0;
        for (Document d : corpus) {
            if (Tokenizer.tokenize(d.text()).contains(term)) df++;
        }
        double idf = Math.log((corpus.size() + 1.0) / (df + 1.0)) + 1.0;
        return tf * idf;
    }

    public List<String> search(String query, int k) {
        Set<String> terms = new LinkedHashSet<>(Tokenizer.tokenize(query));
        if (terms.isEmpty() || k <= 0) return List.of();

        Map<String, Double> scores = new HashMap<>();
        for (Document doc : corpus) {
            double total = 0;
            for (String term : terms) total += score(term, doc);
            if (total > 0) scores.put(doc.id(), total);
        }

        return scores.entrySet().stream()
                .sorted(Map.Entry.<String, Double>comparingByValue().reversed()
                        .thenComparing(Map.Entry.comparingByKey()))
                .limit(k)
                .map(Map.Entry::getKey)
                .toList();
    }
}`,
    },
    {
      name: "Main.java",
      note: "演示查询",
      code: String.raw`package com.example.search;

import com.example.search.index.InvertedIndex;
import com.example.search.model.Document;
import com.example.search.rank.TfIdfRanker;
import java.util.List;

public class Main {
    public static void main(String[] args) {
        List<Document> docs = List.of(
                new Document("d1", "java stream stream"),
                new Document("d2", "java lambda"),
                new Document("d3", "python data"));

        InvertedIndex index = new InvertedIndex();
        index.addAll(docs);
        System.out.println(index.lookup("java"));

        TfIdfRanker ranker = new TfIdfRanker(docs);
        System.out.println(ranker.search("java stream", 2));
    }
}`,
    },
  ],
  localSetup: [
    "mkdir -p mini-search/src/main/java/com/example/search",
    "按 package 放入 5 个参考文件",
    "javac -d out $(find src/main/java -name '*.java')",
    "java -cp out com.example.search.Main",
  ],
  localNotes: [
    "把文档换成从文件读入的列表，索引构建代码不用改。",
    "用 JUnit 对 score() 做近似断言时，记得给误差范围（1e-9）。",
  ],
  extensions: [
    "BM25：在 TF 上增加饱和函数与文档长度归一化，效果通常比原始 TF-IDF 好。",
    "中文分词：接入 HanLP 或按二元切分，建立中文索引。",
    "短语查询：要求词在文档中相邻，或按位置信息做邻近匹配。",
    "持久化索引：把 TreeMap 序列化为 JSON，启动时加载。",
  ],
  refs: [
    { name: "《信息检索导论》（Introduction to Information Retrieval）", url: "https://www.ituring.com.cn/search?q=信息检索导论", why: "倒排索引、TF-IDF、向量空间模型的经典教材。" },
    { name: "GitHub: krahets/hello-algo", url: "https://github.com/krahets/hello-algo", why: "哈希表与排序的 Java 实现，补数据结构的底。" },
    { name: "Elasticsearch 官方文档 · 相关性打分", url: "https://www.elastic.co/guide/en/elasticsearch/reference/current/query-dsl-script-score-query.html", why: "看工业级检索如何做 BM25 与自定义打分。" },
  ],
});
