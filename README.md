# JavaForge · Java 训练场

面向“学过 Java，但忘得差不多了”的学习者：讲解约 45%，练习约 55%；所有代码都用本机真实 JDK 编译执行，不上传代码。

在线访问：**https://fkakfjfwfi.github.io/javaforge/**

在线版是**阅读模式**：课程、速查表、书单、进度可正常使用；编码练习需要本机 JDK，按下面「本地运行」启动 `serve.py` 后即可编译判题。

## 包含什么

- 4 个模块、14 节课：基础重塑 → 面向对象与核心类库 → 进阶 → 实战与工程化
- 76 个练习：课内 56 个（42 道编码题 + 14 道概念自测）+ 项目工坊 20 个检查点
- 5 个简历级项目：任务 CLI、日志 ETL、迷你搜索引擎、线程安全缓存、账户转账引擎
- 浏览器内 CodeMirror 编辑器 + 本机 `javac` / `java` 编译运行，编译错误、运行异常、超时分别提示
- 判题、提示、参考答案、进度记录（localStorage）、连续学习天数
- 18 本参考书 / 开源仓库（图灵社区、GitHub、Oracle 官方文档）
- 10 类可搜索速查表 + 自由练习场

## 本地运行

需要：

- JDK 17 或更高版本（推荐 JDK 21/25；`javac`、`java` 在 PATH 上）
- Python 3（只用标准库，无第三方依赖）

```bash
python serve.py
# 打开 http://127.0.0.1:8000
```

换端口：`python serve.py 8080`。

不要直接双击 `index.html`：页面会提示 `file://` 无法调用本机 JDK；练习必须通过 `serve.py` 提供的 `/api/run` 接口执行。

## 目录结构

```
index.html                    页面外壳
serve.py                      静态服务器 + /api/run（写临时目录、javac 编译、java 执行）
assets/css/style.css          视觉系统与响应式布局
assets/js/app.js              路由、渲染、进度、判题交互
assets/js/data/               课程、项目、书单、速查表（改内容主要改这里）
  module-foundations.js       模块 01：基础重塑
  module-intermediate.js      模块 02：面向对象与核心类库
  module-advanced.js          模块 03：进阶
  module-projects.js          模块 04：实战与工程化
  project-taskcli.js          项目 01：任务 CLI
  project-loglab.js           项目 02：日志 ETL
  project-search.js           项目 03：迷你搜索引擎
  project-cache.js            项目 04：线程安全缓存
  project-bank.js             项目 05：账户与转账
  books.js
  cheatsheet.js
tools/
  dump-data.js                把课程数据导出为 JSON（验证脚本使用）
  verify.py                   逐题编译 + 判题验证
  check-sections.py           编译正文完整示例与项目参考实现
```

## 修改课程

课程是纯数据，不需要改渲染逻辑。每节课的结构：

```js
{
  id: "hello-java",            // URL 标识，全局唯一
  title: "从 javac 到 main：Java 程序的骨架",
  summary: "…",
  level: "基础重塑",
  minutes: 20,
  objectives: ["…"],           // 学完能做到什么
  sections: [                  // 正文块：h / p / code / callout / table / list
    { type: "h", text: "…" },
    { type: "p", html: "…" },
    { type: "code", file: "Hello.java", code: "…", output: "…" }
  ],
  exercises: [
    {
      id: "f1-1",              // 全局唯一，进度按它记录
      kind: "code",
      title: "…",
      prompt: "…",
      starter: "能编译的初始代码",
      solution: "参考答案",
      hints: ["…"],
      check: "判题脚本（Java 方法体，见下）"
    },
    { id: "f1-4", kind: "quiz", question: "…", options: ["…"], answer: 1, explain: "…" }
  ],
  further: ["对应书目章节"]
}
```

### 判题脚本怎么写

练习的用户代码固定写在 `Main.java` 里（可以带多个非 public 类）。点「检查答案」时，`serve.py` 会额外生成一个 `Judge.java`：

```java
public class Judge {
    static void check(boolean ok, String msg) { ... }
    static void eq(Object actual, Object expected, String msg) { ... }
    static void near(double actual, double expected, double eps, String msg) { ... }

    public static void main(String[] args) throws Exception {
        // 你的 check 内容原样插在这里
    }
}
```

`check` 里可以直接调用 `Main` 的 public / package-private 静态方法，也可以 new 练习里定义的其他类。已预导入 `java.util.*`、`java.util.stream.*`、`java.time.*`、`java.util.concurrent.*`、`java.util.concurrent.atomic.*`、`java.util.function.*`、`java.io.*`、`java.nio.file.*`、`java.math.BigDecimal`。

例：

```java
eq(Main.greeting(), "你好，Java", "greeting() 的返回值不对");
near(Main.median(new int[]{4, 1, 3, 2}), 2.5, 0.0001, "偶数个取平均");
```

判题通过时 `Judge` 会打印 `通过：所有断言成立`，前端据此标记“已通过”。断言失败会抛 `AssertionError`，错误信息显示在输出区。

### 新增编码题时注意

- `starter` 必须是**能编译**的代码：可以返回占位值、可以 TODO，但不能调用不存在的方法。
- `check` 不要依赖控制台输出，直接断言方法返回值或对象状态，最稳。
- 不要让练习依赖第三方库；只允许 JDK 标准库。
- 新增题目后跑一次验证：

```bash
python serve.py 8001          # 一个终端
python tools/verify.py http://127.0.0.1:8001   # 另一个终端
python tools/check-sections.py                 # 正文示例与项目参考实现
```

`verify.py` 会检查：题目 ID 唯一、所有 starter 能编译、所有 solution 能通过 check。

## 修改项目工坊

项目数据在 `assets/js/data/project-*.js`，结构与课程类似，但多了里程碑与完整参考实现：

```js
{
  id: "task-cli",
  type: "project",
  title: "TaskCLI 任务管理器",
  milestones: [{ title: "M1 …", desc: "…", exIds: ["pr1-1"] }],
  exercises: [ /* 检查点，字段同课程练习 */ ],
  files: [{ name: "domain/Task.java", code: "…", lang: "java", note: "…" }],
  resume: { keywords: ["…"], bullets: ["…"] },
  refs: [{ name: "…", url: "…", why: "…" }]
}
```

`files` 里的代码会渲染成可展开、可复制、可下载的卡片。新增项目时记得在 `index.html` 里引入对应脚本，并让 `ex.id` 全局唯一。参考实现按 `package` 分文件，用 `tools/check-sections.py` 可以整组编译验证。

## 外部依赖

| 依赖 | 版本 | 来源 |
| --- | --- | --- |
| CodeMirror | 5.65.16 | jsDelivr CDN（仅编辑器，离线时退化为 textarea） |
| 本机 JDK | 17+ | 你的机器，需 `javac` / `java` 可用 |

练习不需要网络；只有 CodeMirror 的 CSS/JS 走 CDN。完全离线时，编辑器会退化为普通 textarea，运行与判题仍然可用。

## 已知限制

- 只能在本地通过 `serve.py` 运行；静态托管（GitHub Pages 等）没有 Java 后端，练习无法执行。
- 单文件模型：用户代码固定是 `Main.java`，不支持多文件项目与 `package`。
- 只提供 JDK 标准库，没有 JUnit、Spring、MySQL 驱动等第三方依赖。
- 前端没有提供 stdin 输入框；需要输入的练习请改用方法返回值。
- 编译 30 秒 / 运行 12 秒超时，死循环会被终止。
- 进度只保存在当前浏览器，换设备不同步。

## 部署（GitHub Pages）

仓库：https://github.com/fkakfjfwfi/javaforge
在线：https://fkakfjfwfi.github.io/javaforge/

如果本机 `git push` 被网络阻断，用仓库内置的 API 发布脚本：

```bash
gh auth status                       # 确认已登录且有 repo 权限
python tools/deploy_github.py "feat: 更新课程内容"
```

脚本会把当前工作区打包成一个 tree，通过 GitHub API 创建提交并更新 `main`，然后等待 Pages 构建完成；首次发布时还会自动开启 Pages（main / root）。如果网络可以正常 `git push`，直接推送也会触发 Pages 重新发布。

## 内容参考

- [Oracle Java Tutorials](https://docs.oracle.com/javase/tutorial/)
- [Snailclimb/JavaGuide](https://github.com/Snailclimb/JavaGuide)
- [krahets/hello-algo](https://github.com/krahets/hello-algo)
- [iluwatar/java-design-patterns](https://github.com/iluwatar/java-design-patterns)
- [阿里巴巴 Java 开发手册（p3c）](https://github.com/alibaba/p3c)
- [图灵社区](https://www.ituring.com.cn/)

课程骨架参考《Java 核心技术 卷 I/II》《Effective Java》《Java 并发编程实战》《深入理解 Java 虚拟机》《代码整洁之道》等书目，每节课末尾都标注了对应的阅读章节。

## 许可

仅用于个人学习。书单中的书名、作者与出版社信息用于指引入口，不包含书籍正文。
