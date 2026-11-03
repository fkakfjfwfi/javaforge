/* JavaForge — 应用主逻辑
   课程渲染 / 进度存储 / 本机 JDK 编译运行 / 练习判题 */
(function () {
  "use strict";

  const CURRICULUM = window.CURRICULUM || { modules: [] };
  const MODULES = CURRICULUM.modules;
  const ALL_LESSONS = MODULES.flatMap((m) =>
    m.lessons.map((l) => Object.assign({}, l, { moduleId: m.id, moduleTitle: m.title, accent: m.accent }))
  );
  const PROJECTS = window.PROJECTS || [];
  const fileRegistry = new Map();
  const STORE_KEY = "javaforge.progress.v1";
  const IS_LOCAL = ["localhost", "127.0.0.1", "::1"].includes(location.hostname);
  const REPO_URL = "https://github.com/fkakfjfwfi/javaforge";
  const app = document.getElementById("app");
  const toastStack = document.getElementById("toast-stack");
  const cmMap = new Map();

  /* ------------------------------------------------------------------
     工具
     ------------------------------------------------------------------ */
  const esc = (s) =>
    String(s == null ? "" : s)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");

  const pad2 = (n) => String(n).padStart(2, "0");
  const todayKey = () => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  };

  function loadProgress() {
    const empty = { done: {}, lessons: {}, last: null, dates: [] };
    try {
      const raw = localStorage.getItem(STORE_KEY);
      if (!raw) return empty;
      const data = JSON.parse(raw);
      return Object.assign(empty, data, {
        done: data.done || {},
        lessons: data.lessons || {},
        dates: Array.isArray(data.dates) ? data.dates : [],
      });
    } catch (e) {
      return empty;
    }
  }

  let progress = loadProgress();

  function saveProgress() {
    try {
      localStorage.setItem(STORE_KEY, JSON.stringify(progress));
    } catch (e) {
      /* 隐私模式下忽略 */
    }
  }

  function touchDate() {
    const t = todayKey();
    if (!progress.dates.includes(t)) {
      progress.dates.push(t);
      if (progress.dates.length > 90) progress.dates = progress.dates.slice(-90);
      saveProgress();
    }
  }

  function isDone(exId) {
    return !!progress.done[exId];
  }

  function markDone(exId, note) {
    if (progress.done[exId]) return false;
    progress.done[exId] = { at: Date.now() };
    touchDate();
    saveProgress();
    if (note) toast(note);
    return true;
  }

  function lessonStats(lesson) {
    const total = lesson.exercises.length;
    const done = lesson.exercises.filter((e) => isDone(e.id)).length;
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function moduleStats(mod) {
    let total = 0;
    let done = 0;
    mod.lessons.forEach((l) => {
      const s = lessonStats(l);
      total += s.total;
      done += s.done;
    });
    return { total, done, pct: total ? Math.round((done / total) * 100) : 0 };
  }

  function overallStats() {
    const lessonTotal = ALL_LESSONS.reduce((n, l) => n + l.exercises.length, 0);
    const projectTotal = PROJECTS.reduce((n, p) => n + p.exercises.length, 0);
    const total = lessonTotal + projectTotal;
    const done = Object.keys(progress.done).length;
    const lessonsDone = ALL_LESSONS.filter((l) => lessonStats(l).done === l.exercises.length).length;
    const projectsDone = PROJECTS.filter((p) => lessonStats(p).done === p.exercises.length).length;
    let streak = 0;
    const d = new Date();
    for (;;) {
      const key = `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
      if (progress.dates.includes(key)) {
        streak += 1;
        d.setDate(d.getDate() - 1);
      } else break;
    }
    return {
      total,
      done,
      pct: total ? Math.round((done / total) * 100) : 0,
      lessonsDone,
      projectsDone,
      lessonTotal,
      projectTotal,
      streak,
    };
  }

  function toast(message, type) {
    const el = document.createElement("div");
    el.className = "toast" + (type === "error" ? " error" : "");
    el.innerHTML = `<span class="toast-mark">${type === "error" ? "!" : "OK"}</span><span>${esc(message)}</span>`;
    toastStack.appendChild(el);
    setTimeout(() => {
      el.classList.add("leaving");
      setTimeout(() => el.remove(), 300);
    }, 2800);
  }

  function findLesson(id) {
    return ALL_LESSONS.find((l) => l.id === id);
  }
  function findModule(id) {
    return MODULES.find((m) => m.id === id);
  }
  function lessonIndexGlobal(id) {
    return ALL_LESSONS.findIndex((l) => l.id === id);
  }
  function firstUnfinished() {
    return ALL_LESSONS.find((l) => lessonStats(l).done < l.exercises.length) || ALL_LESSONS[0];
  }
  function findProject(id) {
    return PROJECTS.find((p) => p.id === id);
  }
  function projectIndexGlobal(id) {
    return PROJECTS.findIndex((p) => p.id === id);
  }

  /* ------------------------------------------------------------------
     Java 语法高亮（静态代码块）
     ------------------------------------------------------------------ */
  const KEYWORDS = new Set(
    ("abstract assert boolean break byte case catch char class const continue default do double else enum exports extends " +
      "final finally float for goto if implements import instanceof int interface long module native new non-sealed open " +
      "opens package permits private protected public record requires return sealed short static strictfp super switch " +
      "synchronized this throw throws to transient try uses var void volatile while yield true false null")
      .split(" ")
      .filter(Boolean)
  );

  function highlightJava(src) {
    let out = "";
    let i = 0;
    const n = src.length;
    const isWord = (c) => /[A-Za-z_$]/.test(c);
    const isWordChar = (c) => /[A-Za-z0-9_$]/.test(c);
    const isUpper = (c) => /[A-Z]/.test(c);

    while (i < n) {
      const c = src[i];
      // 行注释
      if (c === "/" && src[i + 1] === "/") {
        let j = src.indexOf("\n", i);
        if (j < 0) j = n;
        out += `<span class="tok-com">${esc(src.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      // 块注释
      if (c === "/" && src[i + 1] === "*") {
        let j = src.indexOf("*/", i + 2);
        j = j < 0 ? n : j + 2;
        out += `<span class="tok-com">${esc(src.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      // 文本块
      if (src.slice(i, i + 3) === '"""') {
        let j = src.indexOf('"""', i + 3);
        j = j < 0 ? n : j + 3;
        out += `<span class="tok-str">${esc(src.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      // 字符串 / 字符
      if (c === '"' || c === "'") {
        const q = c;
        let j = i + 1;
        while (j < n && src[j] !== q && src[j] !== "\n") {
          if (src[j] === "\\") j += 1;
          j += 1;
        }
        j = Math.min(j + 1, n);
        out += `<span class="tok-str">${esc(src.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      if (isWord(c)) {
        let j = i;
        while (j < n && isWordChar(src[j])) j += 1;
        const word = src.slice(i, j);
        let cls = "";
        if (KEYWORDS.has(word)) cls = "tok-kw";
        else if (isUpper(word[0])) cls = "tok-bi";
        else if (src[j] === "(") cls = "tok-fn";
        out += cls ? `<span class="${cls}">${word}</span>` : esc(word);
        i = j;
        continue;
      }
      if (/[0-9]/.test(c)) {
        let j = i;
        while (j < n && /[0-9._xXa-fA-FLlDd]/.test(src[j])) j += 1;
        out += `<span class="tok-num">${esc(src.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      if (c === "@") {
        let j = i + 1;
        while (j < n && /[A-Za-z0-9_.]/.test(src[j])) j += 1;
        out += `<span class="tok-dec">${esc(src.slice(i, j))}</span>`;
        i = j;
        continue;
      }
      out += esc(c);
      i += 1;
    }
    return out;
  }

  function codeBlock(code, options) {
    const opts = options || {};
    const lines = code.split("\n");
    const gutter = lines.map((_, i) => i + 1).join("\n");
    const out = opts.output
      ? `<div class="code-out"><b>OUT</b><span>${esc(opts.output)}</span></div>`
      : "";
    return `<div class="codeblock">
      <div class="code-head">
        <span class="dots"><i></i><i></i><i></i></span>
        <span class="lang">${opts.lang || "java"}</span>
        ${opts.file ? `<span class="file">${esc(opts.file)}</span>` : ""}
        ${opts.downloadKey ? `<button class="copy" type="button" data-download="${opts.downloadKey}">下载</button>` : ""}
        <button class="copy" type="button" data-copy>复制</button>
      </div>
      <div class="code-body"><div class="gutter">${gutter}</div><pre><code>${opts.plain ? esc(code) : highlightJava(code)}</code></pre></div>
      ${out}
    </div>`;
  }

  /* ------------------------------------------------------------------
     本机 JDK 运行时
     ------------------------------------------------------------------ */
  const runtimeUI = {
    dot: document.getElementById("runtime-dot"),
    text: document.getElementById("runtime-text"),
  };

  class JavaRunner {
    constructor() {
      this.ready = false;
    }

    setStatus(status, detail) {
      const labels = {
        idle: "JDK 待命",
        loading: "检查 JDK…",
        ready: "JDK 就绪",
        error: "JDK 不可用",
        static: "在线阅读模式",
      };
      runtimeUI.dot.className = "status-dot " + (status === "idle" ? "" : status);
      runtimeUI.text.textContent = detail || labels[status] || labels.idle;
    }

    async health() {
      if (location.protocol === "file:") {
        this.setStatus("error", "请用 serve.py 启动");
        return false;
      }
      if (!IS_LOCAL) {
        this.ready = false;
        this.setStatus("static", "在线阅读模式");
        const notice = document.getElementById("hosted-notice");
        if (notice) notice.hidden = false;
        return false;
      }
      this.setStatus("loading");
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        if (!res.ok) throw new Error("HTTP " + res.status);
        const data = await res.json();
        if (!data.ok) throw new Error("没有找到 javac / java");
        this.ready = true;
        this.setStatus("ready", "JDK 就绪 · 本机编译");
        return true;
      } catch (err) {
        this.ready = false;
        this.setStatus("error", "需要 python serve.py");
        return false;
      }
    }

    async run(code, check) {
      if (location.protocol === "file:") {
        return {
          ok: false,
          out: "",
          error: "当前是 file:// 页面，无法调用本机 JDK。请在项目目录运行 python serve.py，然后访问 http://127.0.0.1:8000。",
          phase: "env",
        };
      }
      if (!IS_LOCAL) {
        return {
          ok: false,
          out: "",
          error: "在线站点是阅读模式，不执行 Java 代码。克隆仓库后在本地运行 python serve.py，再访问 http://127.0.0.1:8000 即可编译判题。仓库：" + REPO_URL,
          phase: "env",
        };
      }
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 45000);
      try {
        const res = await fetch("/api/run", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ code, check: check || "" }),
          signal: controller.signal,
        });
        const text = await res.text();
        let data;
        try {
          data = JSON.parse(text);
        } catch (e) {
          throw new Error("服务器返回了非 JSON 内容（HTTP " + res.status + "）");
        }
        this.setStatus("ready", "JDK 就绪 · 本机编译");
        return data;
      } catch (err) {
        const message =
          err && err.name === "AbortError"
            ? "请求超时（45 秒）。服务端可能卡住了，检查一下代码里的死循环。"
            : "无法连接本机 Java 运行器。确认 serve.py 正在运行，并通过 http://127.0.0.1:8000 打开页面。";
        this.setStatus("error");
        return { ok: false, out: "", error: message + "（" + (err.message || err) + "）", phase: "network" };
      } finally {
        clearTimeout(timer);
      }
    }
  }

  const runner = new JavaRunner();

  function consoleMarkup(state) {
    if (state.loading) {
      return `<div class="console-head"><span>OUTPUT</span><span class="right"><span class="loading">● 编译并运行中</span></span></div>
        <pre class="loading">正在调用本机 javac 编译 Main.java…</pre>`;
    }
    const chunks = [];
    if (state.out) chunks.push(`<div class="ok">${esc(state.out)}</div>`);
    if (state.error) chunks.push(`<div class="err">${esc(state.error)}</div>`);
    if (!chunks.length) {
      chunks.push(`<div class="hint">（没有输出。打印结果，或点击「检查答案」运行判题脚本。）</div>`);
    }
    const phase = { compile: "编译失败", run: "运行结束", env: "环境未就绪", network: "连接失败" }[state.phase] || "OUTPUT";
    const label = state.ok ? `<span class="ok">通过</span>` : `<span class="err">${phase}</span>`;
    return `<div class="console-head"><span>OUTPUT</span><span class="right"><span class="t">${label}</span></span></div>
      <pre>${chunks.join("\n")}</pre>`;
  }

  function setConsole(article, state) {
    const el = article.querySelector(".console");
    el.hidden = false;
    el.innerHTML = consoleMarkup(state);
  }

  /* ------------------------------------------------------------------
     HTML 片段
     ------------------------------------------------------------------ */
  function renderSections(sections) {
    let hIndex = 0;
    return sections
      .map((s) => {
        switch (s.type) {
          case "h":
            hIndex += 1;
            return `<h2><span class="hn">${pad2(hIndex)}</span><span>${s.html || esc(s.text)}</span></h2>`;
          case "p":
            return `<p>${s.html}</p>`;
          case "code":
            return codeBlock(s.code, {
              file: s.file,
              output: s.output,
              lang: s.lang,
              plain: s.plain,
              downloadKey: s.downloadKey,
            });
          case "list":
            return `<ul>${s.items.map((item) => `<li>${item}</li>`).join("")}</ul>`;
          case "table":
            return `<div class="table-wrap"><table class="ref"><thead><tr>${s.head
              .map((h) => `<th>${h}</th>`)
              .join("")}</tr></thead><tbody>${s.rows
              .map((row) => `<tr>${row.map((cell) => `<td>${cell}</td>`).join("")}</tr>`)
              .join("")}</tbody></table></div>`;
          case "callout": {
            const ico = { tip: "i", warn: "!", deep: "★", good: "✓" }[s.tone] || "i";
            return `<aside class="callout ${s.tone || "tip"}"><span class="co-icon">${ico}</span>
              <p>${s.title ? `<span class="co-title">${s.title}</span>` : ""}${s.html}</p></aside>`;
          }
          default:
            return "";
        }
      })
      .join("");
  }

  function exerciseStatusMarkup(ex) {
    const done = isDone(ex.id);
    if (ex.kind === "quiz") {
      return `<span class="quiz-status ${done ? "pass" : ""}">${done ? "已答对" : "未作答"}</span>`;
    }
    return `<span class="ex-status ${done ? "pass" : ""}">${done ? "已通过" : "未完成"}</span>`;
  }

  function renderCodeExercise(ex, index, label) {
    const done = isDone(ex.id);
    return `<article class="exercise ${done ? "passed" : ""}" id="ex-${ex.id}" data-ex="${ex.id}">
      <div class="ex-head">
        <span class="ex-badge">${label || "练习"} ${pad2(index)}</span>
        <span class="ex-title">${ex.title}</span>
        <span class="ex-diff">${ex.difficulty || "★★☆"}</span>
        ${exerciseStatusMarkup(ex)}
      </div>
      <div class="ex-body">
        <div class="ex-prompt">${ex.prompt}</div>
        <div class="editor-shell" id="shell-${ex.id}">
          <div class="ed-bar"><span>Main.java</span><span class="live" id="live-${ex.id}">${window.CodeMirror ? "CODEMIRROR" : "PLAIN"}</span></div>
          <div id="editor-${ex.id}"></div>
        </div>
        <div class="ex-toolbar">
          <button class="btn btn-accent btn-sm" type="button" data-act="run">▶ 运行</button>
          <button class="btn btn-primary btn-sm" type="button" data-act="check">检查答案</button>
          <button class="btn btn-outline btn-sm" type="button" data-act="hint">提示</button>
          <button class="btn btn-ghost btn-sm" type="button" data-act="solution">参考答案</button>
          <button class="btn btn-ghost btn-sm" type="button" data-act="reset">重置</button>
          <span class="spacer"></span>
          <span class="hint-key">Ctrl / ⌘ + Enter 运行</span>
        </div>
        <div class="hints" hidden></div>
        <div class="solution" hidden>
          <div class="solution-head"><span>SOLUTION</span><button class="btn btn-ghost btn-sm" type="button" data-act="load-solution">载入编辑器</button></div>
          <pre>${esc(ex.solution || "")}</pre>
        </div>
        <div class="console" hidden></div>
      </div>
    </article>`;
  }

  function renderQuiz(ex) {
    const done = isDone(ex.id);
    return `<article class="quiz" id="ex-${ex.id}" data-ex="${ex.id}">
      <div class="quiz-head">
        <span class="quiz-kind">自测</span>
        <span class="quiz-status ${done ? "pass" : ""}">${done ? "已答对" : "未作答"}</span>
      </div>
      <p class="quiz-q">${ex.question}</p>
      <div class="quiz-options">
        ${ex.options
          .map(
            (opt, i) =>
              `<button class="quiz-opt" type="button" data-opt="${i}"><span class="letter">${"ABCD"[i]}</span><span>${opt}</span></button>`
          )
          .join("")}
      </div>
      <div class="quiz-explain">${ex.explain || ""}</div>
    </article>`;
  }

  /* ------------------------------------------------------------------
     首页
     ------------------------------------------------------------------ */
  function renderHome() {
    const stats = overallStats();
    const next = firstUnfinished();
    const nextStats = lessonStats(next);
    const heroCode = `record Learner(String name, int minutes) {}

public class Main {
    public static void main(String[] args) {
        var you = new Learner("你", 25);
        System.out.println(you.name() + " 连续练习 " + you.minutes() + " 分钟");
    }
}`;

    const modulesHtml = MODULES.map((mod) => {
      const s = moduleStats(mod);
      return `<article class="module-card" style="--accent:${mod.accent}">
        <div class="module-card-head">
          <div>
            <span class="module-index">MODULE ${mod.index}</span>
            <h3>${mod.title}</h3>
            <p class="tagline">${mod.tagline}</p>
          </div>
          <div class="ring" style="--p:${s.pct}">${s.pct}%</div>
        </div>
        <p class="module-desc">${mod.description}</p>
        <div class="lesson-chips">
          ${mod.lessons
            .map((l, i) => {
              const ls = lessonStats(l);
              const done = ls.done === ls.total;
              return `<a class="lesson-chip ${done ? "done" : ""}" href="#/lesson/${l.id}">
                <span class="dot"></span><span class="n">${pad2(i + 1)}</span>
                <span>${l.title}</span>
                <span class="go">${done ? "完成" : ls.done + "/" + ls.total}</span>
              </a>`;
            })
            .join("")}
        </div>
      </article>`;
    }).join("");

    app.innerHTML = `<div class="page">
      <section class="hero">
        <div>
          <span class="eyebrow">Java · ${ALL_LESSONS.length} lessons · ${PROJECTS.length} projects</span>
          <h1>把忘掉的，<br><span class="mark">重新写会</span>。</h1>
          <p class="hero-lead">为“学过 Java、但面试或写项目时想不起来”的你准备。讲解只占 <strong>45%</strong>，剩下 <strong>55%</strong> 是直接调用本机 JDK 编译运行的练习——从语法断层一路补到并发与 JVM。</p>
          <div class="hero-actions">
            <a class="btn btn-primary btn-lg" href="#/lesson/${next.id}">${nextStats.done ? "继续学习" : "从第一课开始"} <span aria-hidden="true">→</span></a>
            <a class="btn btn-outline btn-lg" href="#/projects">进入项目工坊</a>
            <a class="btn btn-ghost btn-lg" href="#/books">参考书单</a>
          </div>
          <div class="hero-meta">
            <span><b>${ALL_LESSONS.length}</b> 节精讲</span>
            <span><b>${PROJECTS.length}</b> 个简历项目</span>
            <span><b>${stats.total}</b> 个练习 / 检查点</span>
            <span><b>JDK 17+</b> 真实编译</span>
          </div>
        </div>
        <div class="hero-term">
          <div class="term-head">
            <span class="term-dot"></span><span class="term-dot"></span><span class="term-dot"></span>
            <span class="term-title">Main.java</span>
          </div>
          <div class="term-body">
            <pre>${highlightJava(heroCode)}</pre>
            <div class="term-out"><span>javac Main.java &amp;&amp; java Main</span><b>你 连续练习 25 分钟</b></div>
          </div>
        </div>
      </section>

      <section class="stat-strip">
        <div class="stat"><b>${stats.done}</b><span>已完成练习</span></div>
        <div class="stat"><b>${stats.lessonsDone} / ${stats.projectsDone}</b><span>通关课程 / 项目</span></div>
        <div class="stat"><b>${stats.pct}%</b><span>总进度</span></div>
        <div class="stat"><b>${stats.streak}</b><span>连续学习天数</span></div>
      </section>

      <section>
        <div class="section-head">
          <div>
            <h2>学习路径</h2>
            <p>四个模块按顺序推进。每节课配 3 道编码题和至少 1 道概念自测，全部通过才算通关。</p>
          </div>
          <span class="side">${ALL_LESSONS.length} lessons / 4 modules</span>
        </div>
        <div class="path-grid">${modulesHtml}</div>
        <div class="daily">
          <div class="daily-txt"><b>不知道从哪开始？</b> 随机抽一道还没通过的题，直接练手。</div>
          <button class="btn btn-outline" type="button" id="random-ex">随机一题 →</button>
        </div>
      </section>

      <section style="margin-top:64px">
        <div class="section-head">
          <div>
            <span class="eyebrow">Project Lab · 简历级实战</span>
            <h2>把知识点做成能展示的项目</h2>
            <p>每个项目都有明确需求、分阶段里程碑、可判题的核心逻辑和完整参考实现，最后附简历写法与扩展方向。</p>
          </div>
          <a class="btn btn-outline" href="#/projects">全部 ${PROJECTS.length} 个项目 →</a>
        </div>
        <div class="project-grid">${PROJECTS.map(projectCardMarkup).join("")}</div>
      </section>

      <section style="margin-top:64px">
        <div class="section-head">
          <div>
            <h2>为什么这样设计</h2>
            <p>知识点对标经典教材的章节骨架，练习则把书上的“看懂”变成“编译通过”。</p>
          </div>
        </div>
        <div class="path-grid">
          <div class="module-card" style="--accent:var(--teal)">
            <span class="module-index">METHOD · 01</span>
            <h3>先暴露问题，再给答案</h3>
            <p class="module-desc">每节课从一个真实的坑开始：<code>==</code> 与 <code>equals</code>、Integer 缓存、<code>List.remove(int)</code>、自动装箱空指针、<code>SimpleDateFormat</code> 线程不安全……判题会立刻验证你的修复是否成立。</p>
            <div class="lesson-chips">
              <div class="lesson-chip"><span class="dot"></span><span>判题基于断言，结果只有“过 / 不过”</span></div>
              <div class="lesson-chip"><span class="dot"></span><span>编译错误、运行异常、超时分别提示</span></div>
            </div>
          </div>
          <div class="module-card" style="--accent:var(--amber)">
            <span class="module-index">METHOD · 02</span>
            <h3>书单作为“第二条腿”</h3>
            <p class="module-desc">每节课末尾给出对应书目章节：图灵社区的《Java 核心技术》《Effective Java》《深入理解 Java 虚拟机》，以及 GitHub 上高星的 JavaGuide、hello-algo。网站负责练，书负责深。</p>
            <div class="lesson-chips">
              <div class="lesson-chip"><span class="dot"></span><span><a href="#/books">查看全部 ${(window.BOOKS || []).length} 本参考书 / 仓库</a></span></div>
            </div>
          </div>
        </div>
      </section>
    </div>`;

    const randomBtn = document.querySelector("#random-ex");
    if (randomBtn) {
      randomBtn.addEventListener("click", () => {
        const pool = [
          ...ALL_LESSONS.flatMap((l) => l.exercises.filter((e) => !isDone(e.id)).map((e) => ({ unit: l, type: "lesson", ex: e }))),
          ...PROJECTS.flatMap((p) => p.exercises.filter((e) => !isDone(e.id)).map((e) => ({ unit: p, type: "project", ex: e }))),
        ];
        if (!pool.length) {
          toast("所有练习都通过了，去练习场自由发挥吧。");
          return;
        }
        const pick = pool[Math.floor(Math.random() * pool.length)];
        location.hash =
          pick.type === "project" ? `#/project/${pick.unit.id}?focus=${pick.ex.id}` : `#/lesson/${pick.unit.id}?focus=${pick.ex.id}`;
      });
    }
  }

  /* ------------------------------------------------------------------
     课程页
     ------------------------------------------------------------------ */
  function renderLesson(lessonId, params) {
    const lesson = findLesson(lessonId);
    if (!lesson) {
      location.hash = "#/";
      return;
    }
    const mod = findModule(lesson.moduleId);
    const stats = lessonStats(lesson);
    const globalIdx = lessonIndexGlobal(lesson.id);
    const prev = ALL_LESSONS[globalIdx - 1];
    const next = ALL_LESSONS[globalIdx + 1];
    const codeCount = lesson.exercises.filter((e) => e.kind === "code").length;
    const quizCount = lesson.exercises.filter((e) => e.kind === "quiz").length;

    progress.lessons[lesson.id] = { at: Date.now() };
    progress.last = lesson.id;
    touchDate();
    saveProgress();

    const sideLinks = mod.lessons
      .map((l, i) => {
        const s = lessonStats(l);
        const isCurrent = l.id === lesson.id;
        return `<a class="side-link ${isCurrent ? "current" : ""} ${s.done === s.total ? "done" : ""}"
          href="#/lesson/${l.id}" data-lesson="${l.id}" ${isCurrent ? 'style="--accent:' + mod.accent + '"' : ""}>
          <span class="idx">${pad2(i + 1)}</span><span>${l.title}</span></a>`;
      })
      .join("");

    app.innerHTML = `<div class="lesson-layout" style="--accent:${mod.accent}">
      <aside class="sidebar">
        <a class="sidebar-back" href="#/">← 全部课程</a>
        <p class="side-title">Module ${mod.index}</p>
        <p class="side-module-name">${mod.title}</p>
        <nav class="side-list">${sideLinks}</nav>
        <div class="side-progress">
          <div class="bar"><i class="js-lesson-bar" style="width:${stats.pct}%"></i></div>
          <div class="meta"><span>本课进度</span><span class="js-lesson-count">${stats.done}/${stats.total}</span></div>
        </div>
      </aside>

      <div>
        <header class="lesson-head">
          <div class="lesson-crumb">${mod.title}<span class="sep">/</span>Lesson ${pad2(globalIdx + 1)}<span class="sep">/</span>${lesson.level}</div>
          <h1>${lesson.title}</h1>
          <p class="lesson-summary">${lesson.summary}</p>
          <div class="meta-row">
            <span class="meta-pill level">${lesson.level}</span>
            <span class="meta-pill">${lesson.minutes} 分钟</span>
            <span class="meta-pill ratio">讲解 45% · 练习 55%</span>
            <span class="meta-pill">${codeCount} 编码 + ${quizCount} 自测</span>
          </div>
        </header>

        <div class="objectives">
          <span class="obj-head">学完这一节，你应该能</span>
          <ul>${lesson.objectives.map((o) => `<li>${o}</li>`).join("")}</ul>
        </div>

        <div class="prose">${renderSections(lesson.sections, mod.accent)}</div>

        <div class="practice-head">
          <span class="badge">PRACTICE</span>
          <h2>动手环节</h2>
          <span class="ratio-note">${codeCount} 编码题 · ${quizCount} 自测 · 全对即通关</span>
        </div>
        ${lesson.exercises
          .map((ex, i) => (ex.kind === "quiz" ? renderQuiz(ex, i + 1) : renderCodeExercise(ex, i + 1)))
          .join("")}

        ${
          lesson.further && lesson.further.length
            ? `<div class="further">
          <div class="f-head">FURTHER READING · 对应书目章节</div>
          <ul>${lesson.further.map((f) => `<li>${f}</li>`).join("")}</ul>
        </div>`
            : ""
        }

        <nav class="lesson-foot">
          ${prev ? `<a class="next-card" href="#/lesson/${prev.id}"><small>← 上一课</small><b>${prev.title}</b></a>` : `<span></span>`}
          ${next ? `<a class="next-card" href="#/lesson/${next.id}" style="text-align:right"><small>下一课 →</small><b>${next.title}</b></a>` : `<a class="next-card" href="#/progress" style="text-align:right"><small>全部完成</small><b>查看我的进度</b></a>`}
        </nav>
      </div>
    </div>`;

    lesson.exercises.forEach((ex, i) => {
      if (ex.kind === "quiz") bindQuiz(ex, lesson);
      else initCodeExercise(ex, lesson, i);
    });

    focusExercise(params);
  }

  function focusExercise(params) {
    const focus = params && params.get("focus");
    if (focus) {
      const target = document.getElementById("ex-" + focus);
      if (target) {
        setTimeout(() => {
          target.scrollIntoView({ behavior: "smooth", block: "center" });
          target.style.boxShadow = "0 0 0 2px var(--blue)";
          setTimeout(() => (target.style.boxShadow = ""), 1600);
          const btn = target.querySelector('[data-act="run"]');
          if (btn) btn.focus({ preventScroll: true });
        }, 120);
      }
    } else {
      window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  /* ------------------------------------------------------------------
     项目工坊
     ------------------------------------------------------------------ */
  function projectCardMarkup(p) {
    const s = lessonStats(p);
    return `<a class="project-card" href="#/project/${p.id}" style="--accent:${p.accent}">
      <div class="project-card-top">
        <span class="project-index">PROJECT ${p.index}</span>
        <span class="project-mode ${p.mode}">${p.modeLabel}</span>
      </div>
      <h3>${p.title}</h3>
      <p class="project-sub">${p.subtitle}</p>
      <p class="project-sum">${p.summary}</p>
      <div class="stack-pills">${p.stack.slice(0, 4).map((x) => `<span>${x}</span>`).join("")}</div>
      <div class="project-card-foot">
        <span class="project-progress"><i style="width:${s.pct}%"></i></span>
        <span class="project-pct">${s.done}/${s.total}</span>
      </div>
      <div class="project-resume">${p.resumeLine}</div>
    </a>`;
  }

  function renderProjects() {
    const checkpoints = PROJECTS.reduce((n, p) => n + p.exercises.length, 0);
    const completed = PROJECTS.filter((p) => lessonStats(p).done === p.exercises.length).length;
    const generalRefs = [
      {
        name: "Snailclimb/JavaGuide",
        url: "https://github.com/Snailclimb/JavaGuide",
        why: "Java 面试与工程知识的总索引，从集合源码到 JVM、并发、框架都有系统整理。",
      },
      {
        name: "krahets/hello-algo",
        url: "https://github.com/krahets/hello-algo",
        why: "用 Java 等多语言实现的算法教程，配动画图解，适合把数据结构补起来。",
      },
      {
        name: "iluwatar/java-design-patterns",
        url: "https://github.com/iluwatar/java-design-patterns",
        why: "23 种设计模式的 Java 实现与适用场景，读源码比背定义更有用。",
      },
    ];

    app.innerHTML = `<div class="page">
      <span class="eyebrow">Project Lab · ${PROJECTS.length} projects · ${checkpoints} checkpoints</span>
      <div class="section-head">
        <div>
          <h2 style="font-size:34px">项目工坊</h2>
          <p>从“会写方法”到“能交付一个项目”。每个项目拆成 4 个里程碑，核心逻辑可以直接判题；完整参考实现可下载，本地跑起来就能放进 GitHub。</p>
        </div>
        <span class="side">${completed}/${PROJECTS.length} 已完成</span>
      </div>

      <div class="project-grid">${PROJECTS.map(projectCardMarkup).join("")}</div>

      <section style="margin-top:48px">
        <div class="section-head">
          <div><h2>怎么用这些项目</h2><p>不要一次性复制完整代码。按里程碑写，写完一个检查点再进入下一个。</p></div>
        </div>
        <div class="path-grid">
          <div class="module-card" style="--accent:var(--blue)">
            <span class="module-index">STEP · 01</span>
            <h3>先跑通核心逻辑</h3>
            <p class="module-desc">每个检查点都是项目里真实存在的一小块：模型校验、聚合统计、倒排索引、缓存淘汰、转账事务。判题通过，说明这一块行为正确。</p>
            <div class="lesson-chips">
              <div class="lesson-chip"><span class="dot"></span><span>检查点可独立运行，不依赖上一题</span></div>
              <div class="lesson-chip"><span class="dot"></span><span>参考答案通过后可以对照改写</span></div>
            </div>
          </div>
          <div class="module-card" style="--accent:var(--amber)">
            <span class="module-index">STEP · 02</span>
            <h3>下载完整实现，补上工程外壳</h3>
            <p class="module-desc">参考实现按包分层，包含 CLI、测试要点与运行说明。把它放进自己的仓库，改数据、加命令、补 README，再截图写进简历。</p>
            <div class="lesson-chips">
              <div class="lesson-chip"><span class="dot"></span><span>每个项目都附“简历写法”和量化占位符</span></div>
              <div class="lesson-chip"><span class="dot"></span><span>扩展方向足够你继续迭代两周</span></div>
            </div>
          </div>
        </div>
      </section>

      <section style="margin-top:48px">
        <div class="section-head">
          <div><h2>选题原则</h2><p>简历上的项目不在多，而在“能讲清楚问题、方案和结果”。</p></div>
        </div>
        <div class="callout warn" style="margin-top:0">
          <span class="co-icon">!</span>
          <p><span class="co-title">不要只写“图书管理系统”</span>除非它真的有你自己的东西：并发控制、缓存、审计、检索、性能数据。否则面试官很难从中问出有区分度的问题。这 5 个项目刻意选了有明确技术主题的方向：建模与校验、日志 ETL、检索、缓存并发、交易一致性。</p>
        </div>
        <div class="ref-list">
          ${generalRefs
            .map(
              (r) => `<a class="ref-link" href="${r.url}" target="_blank" rel="noopener">
                <b>${r.name}</b><span>${r.why}</span><i>↗</i>
              </a>`
            )
            .join("")}
        </div>
      </section>
    </div>`;
  }

  function projectFilesMarkup(p) {
    return p.files
      .map((f, i) => {
        const key = `dl-${p.id}-${i}`;
        fileRegistry.set(key, { filename: f.name, code: f.code });
        return `<details class="file-card">
          <summary>
            <span class="file-name">${f.name}</span>
            <span class="file-note">${f.note || ""}</span>
            <span class="file-expand">展开</span>
          </summary>
          <div class="file-body">${codeBlock(f.code, {
            file: f.name,
            lang: f.lang || "java",
            plain: f.plain,
            downloadKey: key,
          })}</div>
        </details>`;
      })
      .join("");
  }

  function renderProject(projectId, params) {
    const p = findProject(projectId);
    if (!p) {
      location.hash = "#/projects";
      return;
    }
    const stats = lessonStats(p);
    const globalIdx = projectIndexGlobal(p.id);
    const prev = PROJECTS[globalIdx - 1];
    const next = PROJECTS[globalIdx + 1];

    progress.lessons[p.id] = { at: Date.now() };
    progress.last = p.id;
    touchDate();
    saveProgress();

    const milestoneSide = p.milestones
      .map((m, i) => {
        const done = m.exIds.every(isDone);
        return `<div class="side-milestone ${done ? "done" : ""}" data-milestone data-ex-ids="${m.exIds.join(",")}">
          <span class="idx">M${i + 1}</span><span>${m.title}</span>
        </div>`;
      })
      .join("");

    const milestones = p.milestones
      .map((m, mi) => {
        const exs = m.exIds.map((id) => p.exercises.find((e) => e.id === id)).filter(Boolean);
        const done = m.exIds.every(isDone);
        return `<div class="milestone ${done ? "done" : ""}" data-milestone data-ex-ids="${m.exIds.join(",")}">
          <div class="milestone-head">
            <span class="m-badge">M${mi + 1}</span>
            <div><h3>${m.title}</h3><p>${m.desc}</p></div>
            <span class="m-status ${done ? "pass" : ""}">${done ? "已通过" : "待完成"}</span>
          </div>
          ${exs.map((ex) => renderCodeExercise(ex, p.exercises.indexOf(ex) + 1, "检查点")).join("")}
        </div>`;
      })
      .join("");

    app.innerHTML = `<div class="lesson-layout project-layout" style="--accent:${p.accent}">
      <aside class="sidebar">
        <a class="sidebar-back" href="#/projects">← 项目工坊</a>
        <p class="side-title">Project ${p.index}</p>
        <p class="side-module-name">${p.title}</p>
        <div class="side-milestones">${milestoneSide}</div>
        <div class="side-progress">
          <div class="bar"><i class="js-lesson-bar" style="width:${stats.pct}%"></i></div>
          <div class="meta"><span>项目进度</span><span class="js-lesson-count">${stats.done}/${stats.total}</span></div>
        </div>
      </aside>

      <div>
        <header class="lesson-head project-head">
          <div class="lesson-crumb">项目工坊<span class="sep">/</span>Project ${p.index}<span class="sep">/</span>${p.level}</div>
          <h1>${p.title}</h1>
          <p class="lesson-summary">${p.subtitle} — ${p.summary}</p>
          <div class="meta-row">
            <span class="meta-pill level">${p.level}</span>
            <span class="meta-pill">${p.duration}</span>
            <span class="meta-pill ratio">${p.modeLabel}</span>
            <span class="meta-pill">${p.exercises.length} 个检查点 · ${p.milestones.length} 个里程碑</span>
          </div>
          <div class="stack-pills" style="margin-top:12px">${p.stack.map((x) => `<span>${x}</span>`).join("")}</div>
        </header>

        <section class="resume-card" style="--accent:${p.accent}">
          <div class="resume-head">
            <span class="eyebrow">RESUME VALUE</span>
            <span class="resume-badge">可写进简历</span>
          </div>
          <p class="resume-line">${p.resumeLine}</p>
          <div class="resume-keywords">${p.resume.keywords.map((k) => `<span>${k}</span>`).join("")}</div>
          <ul>${p.highlights.map((h) => `<li>${h}</li>`).join("")}</ul>
        </section>

        <div class="prose">${renderSections(p.sections, p.accent)}</div>

        <section class="proj-block">
          <h2><span class="hn">01</span><span>架构与目录</span></h2>
          <pre class="arch-tree">${esc(p.architecture.tree)}</pre>
          <ul>${p.architecture.notes.map((n) => `<li>${n}</li>`).join("")}</ul>
        </section>

        <div class="practice-head">
          <span class="badge">MILESTONES</span>
          <h2>分阶段完成</h2>
          <span class="ratio-note">按顺序写 · 每个检查点独立判题</span>
        </div>
        ${milestones}

        <div class="practice-head">
          <span class="badge">SOURCE</span>
          <h2>完整参考实现</h2>
          <span class="ratio-note">可展开 · 可复制 · 可下载</span>
        </div>
        <p class="block-lead">先自己写，再对照参考实现。文件里的注释标注了关键决策，不只是“能跑”。</p>
        <div class="file-list">${projectFilesMarkup(p)}</div>

        <section class="proj-block">
          <h2><span class="hn">02</span><span>本地运行</span></h2>
          ${codeBlock(p.localSetup.join("\n"), { file: "terminal", lang: "shell", plain: true })}
          ${p.localNotes && p.localNotes.length ? `<ul>${p.localNotes.map((n) => `<li>${n}</li>`).join("")}</ul>` : ""}
        </section>

        <section class="proj-block">
          <h2><span class="hn">03</span><span>写进简历</span></h2>
          <div class="callout tip" style="margin-top:0">
            <span class="co-icon">i</span>
            <p><span class="co-title">把占位符换成你的真实数据</span>例如“处理 [N] 条日志、P95 耗时 [X] ms、覆盖 [Y] 个测试用例”。没有实测就删掉数字，不要编。</p>
          </div>
          <ul class="resume-bullets">${p.resume.bullets.map((b) => `<li>${b}</li>`).join("")}</ul>
        </section>

        <section class="proj-block">
          <h2><span class="hn">04</span><span>继续扩展</span></h2>
          <ul>${p.extensions.map((e) => `<li>${e}</li>`).join("")}</ul>
        </section>

        <section class="proj-block">
          <h2><span class="hn">05</span><span>参考仓库与文档</span></h2>
          <div class="ref-list">
            ${p.refs
              .map(
                (r) => `<a class="ref-link" href="${r.url}" target="_blank" rel="noopener">
                  <b>${r.name}</b><span>${r.why}</span><i>↗</i>
                </a>`
              )
              .join("")}
          </div>
        </section>

        <nav class="lesson-foot">
          ${prev ? `<a class="next-card" href="#/project/${prev.id}"><small>← 上一个项目</small><b>${prev.title}</b></a>` : `<span></span>`}
          ${next ? `<a class="next-card" href="#/project/${next.id}" style="text-align:right"><small>下一个项目 →</small><b>${next.title}</b></a>` : `<a class="next-card" href="#/projects" style="text-align:right"><small>全部项目</small><b>返回项目工坊</b></a>`}
        </nav>
      </div>
    </div>`;

    p.exercises.forEach((ex, i) => {
      if (ex.kind === "quiz") bindQuiz(ex, p);
      else initCodeExercise(ex, p, i);
    });

    focusExercise(params);
  }

  /* ------------------------------------------------------------------
     编码练习
     ------------------------------------------------------------------ */
  function initCodeExercise(ex, lesson, index) {
    const article = document.getElementById("ex-" + ex.id);
    const shell = document.getElementById("shell-" + ex.id);
    const mount = document.getElementById("editor-" + ex.id);
    const live = document.getElementById("live-" + ex.id);
    let editor;
    let getValue;
    let setValue;

    if (window.CodeMirror) {
      const textarea = document.createElement("textarea");
      textarea.value = ex.starter;
      mount.appendChild(textarea);
      const runRef = () => runExercise(ex, article, lesson, getValue, "run");
      const checkRef = () => runExercise(ex, article, lesson, getValue, "check");
      editor = window.CodeMirror.fromTextArea(textarea, {
        mode: "text/x-java",
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        indentWithTabs: false,
        lineWrapping: false,
        autoCloseBrackets: true,
        styleActiveLine: true,
        viewportMargin: 60,
        extraKeys: {
          Tab: (cm) => cm.replaceSelection("    "),
          "Ctrl-Enter": runRef,
          "Cmd-Enter": runRef,
          "Shift-Ctrl-Enter": checkRef,
          "Shift-Cmd-Enter": checkRef,
        },
      });
      editor.on("focus", () => shell.classList.add("focus"));
      editor.on("blur", () => shell.classList.remove("focus"));
      getValue = () => editor.getValue();
      setValue = (v) => editor.setValue(v);
      live.textContent = "JDK " + (window.__javaVersion || "");
      cmMap.set(ex.id, editor);
    } else {
      const textarea = document.createElement("textarea");
      textarea.className = "fallback-editor";
      textarea.value = ex.starter;
      textarea.spellcheck = false;
      textarea.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          runExercise(ex, article, lesson, () => textarea.value, e.shiftKey ? "check" : "run");
        }
        if (e.key === "Tab") {
          e.preventDefault();
          const start = textarea.selectionStart;
          textarea.setRangeText("    ", start, textarea.selectionEnd, "end");
        }
      });
      mount.appendChild(textarea);
      getValue = () => textarea.value;
      setValue = (v) => (textarea.value = v);
      live.textContent = "PLAIN";
    }

    const hintsEl = article.querySelector(".hints");
    hintsEl.innerHTML = (ex.hints || [])
      .map((h, i) => `<div class="hint"><span class="h-index">H${i + 1}</span><span>${h}</span></div>`)
      .join("");

    article.addEventListener("click", (e) => {
      const btn = e.target.closest("[data-act]");
      if (!btn) return;
      const act = btn.dataset.act;
      if (act === "run" || act === "check") {
        runExercise(ex, article, lesson, getValue, act);
      } else if (act === "hint") {
        hintsEl.hidden = !hintsEl.hidden;
      } else if (act === "solution") {
        article.querySelector(".solution").hidden = false;
        article.querySelector('[data-act="solution"]').disabled = true;
      } else if (act === "load-solution") {
        setValue(ex.solution || "");
        toast("参考答案已载入编辑器，改成自己的写法再跑一次。");
      } else if (act === "reset") {
        setValue(ex.starter);
        toast("已恢复初始代码。已通过的记录不会丢失。");
      }
    });

    if (isDone(ex.id)) article.classList.add("passed");
  }

  async function runExercise(ex, article, lesson, getValue, mode) {
    if (article.dataset.busy === "1") return;
    const code = getValue();
    if (!code.trim()) {
      toast("编辑器是空的，先写点代码。", "error");
      return;
    }
    article.dataset.busy = "1";
    const buttons = article.querySelectorAll("[data-act]");
    buttons.forEach((b) => (b.disabled = true));
    setConsole(article, { loading: true });

    const isCheck = mode === "check";
    let result;
    try {
      result = await runner.run(code, isCheck ? ex.check : null);
    } catch (err) {
      result = { ok: false, out: "", error: "运行时调用失败：" + (err && err.message ? err.message : String(err)), phase: "network" };
    }

    setConsole(article, result);
    article.dataset.busy = "";
    buttons.forEach((b) => (b.disabled = false));

    const statusEl = article.querySelector(".ex-status");
    if (!statusEl) return;
    if (isCheck) {
      if (result.ok) {
        article.classList.add("passed");
        article.classList.remove("failed");
        statusEl.className = "ex-status pass";
        statusEl.textContent = "已通过";
        if (markDone(ex.id)) {
          updateLessonUI(lesson);
          toast("通过 · " + ex.title);
        }
      } else if (!isDone(ex.id)) {
        article.classList.add("failed");
        article.classList.remove("passed");
        statusEl.className = "ex-status fail";
        statusEl.textContent = "未通过";
      }
    }
  }

  function updateLessonUI(lesson) {
    const s = lessonStats(lesson);
    document.querySelectorAll(".js-lesson-bar").forEach((el) => (el.style.width = s.pct + "%"));
    document.querySelectorAll(".js-lesson-count").forEach((el) => (el.textContent = `${s.done}/${s.total}`));
    const sideLink = document.querySelector(`.side-link[data-lesson="${lesson.id}"]`);
    if (sideLink && s.done === s.total) sideLink.classList.add("done");

    document.querySelectorAll("[data-milestone]").forEach((el) => {
      const ids = (el.dataset.exIds || "").split(",").filter(Boolean);
      const done = ids.length > 0 && ids.every(isDone);
      el.classList.toggle("done", done);
      const status = el.querySelector(".m-status");
      if (status) {
        status.textContent = done ? "已通过" : "待完成";
        status.className = "m-status " + (done ? "pass" : "");
      }
    });

    if (s.done === s.total && !(progress.celebrated && progress.celebrated[lesson.id])) {
      progress.celebrated = progress.celebrated || {};
      progress.celebrated[lesson.id] = true;
      saveProgress();
      toast(lesson.type === "project" ? "项目全部检查点通过，可以整理进简历了。" : "本节全部练习通过，可以进入下一课了。");
    }
  }

  /* ------------------------------------------------------------------
     自测题
     ------------------------------------------------------------------ */
  function bindQuiz(ex, lesson) {
    const article = document.getElementById("ex-" + ex.id);
    const options = article.querySelectorAll(".quiz-opt");
    const explain = article.querySelector(".quiz-explain");
    const status = article.querySelector(".quiz-status");

    if (isDone(ex.id)) {
      options[ex.answer].classList.add("correct");
      explain.classList.add("show");
    }

    options.forEach((btn) => {
      btn.addEventListener("click", () => {
        const chosen = Number(btn.dataset.opt);
        if (chosen === ex.answer) {
          article.querySelectorAll(".quiz-opt").forEach((o, i) => {
            o.classList.remove("wrong");
            if (i === ex.answer) o.classList.add("correct");
          });
          explain.classList.add("show");
          status.className = "quiz-status pass";
          status.textContent = "已答对";
          if (markDone(ex.id)) {
            updateLessonUI(lesson);
            toast("答对了 · 继续下一题");
          }
        } else {
          btn.classList.add("wrong");
          options[ex.answer].classList.add("reveal");
          explain.classList.add("show");
          status.className = "quiz-status";
          status.textContent = "再想一想";
          toast("这个选项不对，解析已经展开。", "error");
        }
      });
    });
  }

  /* ------------------------------------------------------------------
     书单
     ------------------------------------------------------------------ */
  let bookFilter = "all";
  let bookQuery = "";

  function renderBooks() {
    const BOOKS = window.BOOKS || [];
    const stages = [
      { id: "all", label: "全部" },
      { id: "entry", label: "入门 / 复习" },
      { id: "mid", label: "中级核心" },
      { id: "adv", label: "进阶 / 工程" },
      { id: "ref", label: "参考 / 文档" },
    ];

    const list = BOOKS.filter((b) => {
      const okStage = bookFilter === "all" || b.stage === bookFilter;
      const q = bookQuery.trim().toLowerCase();
      const okQuery =
        !q ||
        (b.title + " " + b.author + " " + (b.tags || []).join(" ") + " " + b.why).toLowerCase().includes(q);
      return okStage && okQuery;
    });

    app.innerHTML = `<div class="page">
      <div class="section-head" style="margin-bottom:16px">
        <div>
          <span class="eyebrow">Reading list · 图灵社区 / GitHub / 官方文档</span>
          <h2 style="font-size:34px">把书读薄，把代码写厚</h2>
          <p>课程负责给出骨架和练习，这些书负责补细节。按阶段挑选，不用一次全买。每本都标注了“对应模块”，学完哪节卡住了就翻哪章。</p>
        </div>
      </div>
      <div class="filter-row">
        ${stages
          .map(
            (s) =>
              `<button class="filter-chip ${bookFilter === s.id ? "active" : ""}" type="button" data-stage="${s.id}">${s.label}</button>`
          )
          .join("")}
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="book-search" type="search" placeholder="搜索书名、作者、主题" value="${esc(bookQuery)}">
        </div>
      </div>
      <div class="books-grid" id="books-grid">
        ${
          list.length
            ? list
                .map(
                  (b) => `<article class="book-card" style="--spine:${b.color}">
            <div class="book-spine"></div>
            <div class="book-inner">
              <div class="book-top">
                <span class="book-stage ${b.stage}">${b.stageLabel}</span>
                <span class="book-type">${b.type}</span>
              </div>
              <h3>${b.title}</h3>
              <div class="book-author">${b.author}${b.publisher ? " · " + b.publisher : ""}</div>
              <p class="book-why">${b.why}</p>
              <div class="book-tags">${(b.tags || []).map((t) => `<span>${t}</span>`).join("")}</div>
              <div class="book-foot">
                <span class="rel">对应：${b.related}</span>
                <a href="${b.link}" target="_blank" rel="noopener">${b.linkLabel || "查看"} ↗</a>
              </div>
            </div>
          </article>`
                )
                .join("")
            : `<div class="empty-state" style="grid-column:1/-1">没有匹配的书，换个关键词试试。</div>`
        }
      </div>
      <div class="daily" style="margin-top:26px">
        <div class="daily-txt"><b>选书原则：</b>同一阶段只精读一本，其余当字典查。练习量不足时，优先回到课程做题，而不是继续买书。</div>
        <a class="btn btn-outline" href="#/cheatsheet">打开速查表 →</a>
      </div>
    </div>`;

    app.querySelectorAll("[data-stage]").forEach((btn) =>
      btn.addEventListener("click", () => {
        bookFilter = btn.dataset.stage;
        renderBooks();
      })
    );
    const search = app.querySelector("#book-search");
    let composing = false;
    search.addEventListener("compositionstart", () => (composing = true));
    search.addEventListener("compositionend", () => {
      composing = false;
      bookQuery = search.value;
      renderBooks();
    });
    search.addEventListener("input", () => {
      if (composing) return;
      bookQuery = search.value;
      const pos = search.selectionStart;
      renderBooks();
      const again = app.querySelector("#book-search");
      again.focus();
      again.setSelectionRange(pos, pos);
    });
  }

  /* ------------------------------------------------------------------
     速查表
     ------------------------------------------------------------------ */
  let sheetQuery = "";

  function renderCheatsheet() {
    const DATA = window.CHEATSHEET || [];
    const q = sheetQuery.trim().toLowerCase();
    const filtered = DATA.map((cat) => {
      const items = cat.items.filter(
        (it) => !q || (it.t + " " + it.code + " " + (it.note || "")).toLowerCase().includes(q)
      );
      return Object.assign({}, cat, { items });
    }).filter((cat) => cat.items.length);

    app.innerHTML = `<div class="page">
      <span class="eyebrow">Cheatsheet · 可搜索</span>
      <div class="section-head">
        <div>
          <h2 style="font-size:34px">常用写法速查</h2>
          <p>写代码时想不起来语法，来这里找。每一条都能直接复制到练习场运行。</p>
        </div>
        <div class="search-box">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/></svg>
          <input id="sheet-search" type="search" placeholder="搜索：Stream / 泛型 / 正则" value="${esc(sheetQuery)}">
        </div>
      </div>
      <div class="cheat-grid">
        ${
          filtered.length
            ? filtered
                .map(
                  (cat) => `<section class="cheat-card">
            <div class="cheat-head"><h3>${cat.name}</h3><span class="n">${cat.items.length}</span></div>
            ${cat.items
              .map(
                (it) => `<div class="cheat-item">
                <div class="t">${it.t}<button class="copy-mini" type="button" data-copy>COPY</button></div>
                <pre>${esc(it.code)}</pre>
                ${it.note ? `<div class="note">${it.note}</div>` : ""}
              </div>`
              )
              .join("")}
          </section>`
                )
                .join("")
            : `<div class="empty-state" style="grid-column:1/-1">没有找到，试试更短的关键词。</div>`
        }
      </div>
      <div class="daily" style="margin-top:26px">
        <div class="daily-txt"><b>提示：</b>速查表只是索引，真正的记忆来自手写。复制之后，试着不看屏幕再敲一遍。</div>
        <a class="btn btn-outline" href="#/playground">去练习场验证 →</a>
      </div>
    </div>`;

    const search = app.querySelector("#sheet-search");
    let composing = false;
    search.addEventListener("compositionstart", () => (composing = true));
    search.addEventListener("compositionend", () => {
      composing = false;
      sheetQuery = search.value;
      renderCheatsheet();
    });
    search.addEventListener("input", () => {
      if (composing) return;
      sheetQuery = search.value;
      const pos = search.selectionStart;
      renderCheatsheet();
      const again = app.querySelector("#sheet-search");
      again.focus();
      again.setSelectionRange(pos, pos);
    });
  }

  /* ------------------------------------------------------------------
     练习场
     ------------------------------------------------------------------ */
  const PG_EXAMPLES = [
    {
      name: "Stream：分组统计",
      tag: "Collectors",
      code: String.raw`import java.util.*;
import java.util.stream.*;

public class Main {
    record Sale(String city, int amount) {}

    public static void main(String[] args) {
        List<Sale> sales = List.of(
            new Sale("北京", 120), new Sale("上海", 95),
            new Sale("北京", 88), new Sale("广州", 70)
        );

        Map<String, IntSummaryStatistics> stats = sales.stream()
            .collect(Collectors.groupingBy(
                Sale::city,
                Collectors.summarizingInt(Sale::amount)));

        stats.forEach((city, s) ->
            System.out.printf("%s 共 %d 笔，平均 %.1f%n", city, s.getCount(), s.getAverage()));
    }
}`,
      output: "上海 共 1 笔，平均 95.0\n北京 共 2 笔，平均 104.0\n广州 共 1 笔，平均 70.0",
    },
    {
      name: "record + switch 模式匹配",
      tag: "Java 21",
      code: String.raw`sealed interface Shape permits Circle, Rect, Triangle {}
record Circle(double r) implements Shape {}
record Rect(double w, double h) implements Shape {}
record Triangle(double base, double height) implements Shape {}

public class Main {
    static double area(Shape s) {
        return switch (s) {
            case Circle c -> Math.PI * c.r() * c.r();
            case Rect r -> r.w() * r.h();
            case Triangle t -> 0.5 * t.base() * t.height();
        };
    }

    public static void main(String[] args) {
        System.out.printf("圆 %.2f%n", area(new Circle(2)));
        System.out.printf("矩形 %.2f%n", area(new Rect(3, 4)));
    }
}`,
      output: "圆 12.57\n矩形 12.00",
    },
    {
      name: "并发：CompletableFuture",
      tag: "async",
      code: String.raw`import java.util.concurrent.*;

public class Main {
    static String fetch(String name, long delay) {
        try { Thread.sleep(delay); } catch (InterruptedException e) { Thread.currentThread().interrupt(); }
        return name + " 完成";
    }

    public static void main(String[] args) throws Exception {
        try (ExecutorService pool = Executors.newFixedThreadPool(3)) {
            CompletableFuture<String> a = CompletableFuture.supplyAsync(() -> fetch("A", 200), pool);
            CompletableFuture<String> b = CompletableFuture.supplyAsync(() -> fetch("B", 100), pool);
            CompletableFuture<String> c = CompletableFuture.supplyAsync(() -> fetch("C", 300), pool);

            CompletableFuture.allOf(a, b, c).join();
            System.out.println(a.join());
            System.out.println(b.join());
            System.out.println(c.join());
        }
    }
}`,
      output: "A 完成\nB 完成\nC 完成",
    },
    {
      name: "集合：Map 与排序",
      tag: "HashMap / Comparator",
      code: String.raw`import java.util.*;

public class Main {
    public static void main(String[] args) {
        String text = "java stream lambda record stream java";
        Map<String, Integer> counts = new HashMap<>();
        for (String w : text.split(" ")) {
            counts.merge(w, 1, Integer::sum);
        }

        counts.entrySet().stream()
            .sorted(Map.Entry.<String, Integer>comparingByValue().reversed()
                .thenComparing(Map.Entry.comparingByKey()))
            .forEach(e -> System.out.println(e.getKey() + " = " + e.getValue()));
    }
}`,
      output: "stream = 2\njava = 2\nlambda = 1\nrecord = 1",
    },
    {
      name: "文本块与正则",
      tag: "text block / Pattern",
      code: String.raw`import java.util.regex.*;

public class Main {
    public static void main(String[] args) {
        String json = """
                {"name": "JavaForge", "version": 1}
                """;
        System.out.println(json.strip());

        Pattern p = Pattern.compile("(\\w+):\\s*([^,}]+)");
        Matcher m = p.matcher("name: 林, city: 北京, score: 88");
        while (m.find()) {
            System.out.println(m.group(1) + " -> " + m.group(2).strip());
        }
    }
}`,
      output: "{\"name\": \"JavaForge\", \"version\": 1}\nname -> 林\ncity -> 北京\nscore -> 88",
    },
    {
      name: "java.time：日期计算",
      tag: "LocalDate / Duration",
      code: String.raw`import java.time.*;
import java.time.temporal.ChronoUnit;

public class Main {
    public static void main(String[] args) {
        LocalDate start = LocalDate.of(2026, 3, 1);
        LocalDate end = LocalDate.of(2026, 11, 3);
        System.out.println("相隔天数：" + ChronoUnit.DAYS.between(start, end));

        LocalDate deadline = LocalDate.now().plusDays(14);
        System.out.println("两周后：" + deadline + "（" + deadline.getDayOfWeek() + "）");

        Duration d = Duration.ofMinutes(95);
        System.out.println(d.toHours() + " 小时 " + (d.toMinutes() % 60) + " 分钟");
    }
}`,
      output: "相隔天数：247\n两周后：2026-11-17（Tuesday）\n1 小时 35 分钟",
    },
  ];

  function renderPlayground() {
    app.innerHTML = `<div class="page">
      <span class="eyebrow">Playground · 本机 JDK 编译执行</span>
      <div class="section-head">
        <div>
          <h2 style="font-size:34px">自由练习场</h2>
          <p>不判题，随便写。调用本机 JDK 编译运行完整 Java 程序，支持集合、Stream、并发、NIO 与 java.time；代码只在本地执行。</p>
        </div>
        <span class="side">Ctrl / ⌘ + Enter 运行</span>
      </div>
      <div class="playground-layout">
        <div class="pg-main">
          <div class="pg-head">
            <span class="pg-title">Main.java</span>
            <span class="spacer"></span>
            <button class="btn btn-accent btn-sm" type="button" id="pg-run">▶ 运行</button>
            <button class="btn btn-ghost btn-sm" type="button" id="pg-clear">清空</button>
          </div>
          <div id="pg-editor"></div>
          <div class="console" id="pg-console" hidden></div>
        </div>
        <aside class="pg-side">
          <div class="pg-card">
            <h4>示例片段</h4>
            <div class="example-list">
              ${PG_EXAMPLES.map(
                (e, i) =>
                  `<button class="example-btn" type="button" data-example="${i}"><b>${e.name}</b><span>${e.tag}</span></button>`
              ).join("")}
            </div>
          </div>
          <div class="pg-card">
            <h4>能用到什么</h4>
            <p>本机 JDK 的标准库：<code class="inline-code">java.util</code>、<code class="inline-code">java.util.stream</code>、<code class="inline-code">java.time</code>、<code class="inline-code">java.util.concurrent</code>、<code class="inline-code">java.nio.file</code>。第三方依赖（Spring、JUnit）未加入 classpath，课程练习全部基于标准库。</p>
          </div>
          <div class="pg-card">
            <h4>运行限制</h4>
            <p>单次运行超过 12 秒会被终止（防止死循环）。程序每次在独立临时目录中编译，文件读写不会影响你的项目。需要 JDK 17+，推荐 JDK 21/25。</p>
          </div>
        </aside>
      </div>
    </div>`;

    const mount = document.getElementById("pg-editor");
    const initial = PG_EXAMPLES[0].code;
    let editor;
    let getValue;
    let setValue;

    if (window.CodeMirror) {
      const ta = document.createElement("textarea");
      ta.value = initial;
      mount.appendChild(ta);
      editor = window.CodeMirror.fromTextArea(ta, {
        mode: "text/x-java",
        lineNumbers: true,
        indentUnit: 4,
        tabSize: 4,
        autoCloseBrackets: true,
        styleActiveLine: true,
        viewportMargin: 200,
        extraKeys: { Tab: (cm) => cm.replaceSelection("    "), "Ctrl-Enter": () => runPG(), "Cmd-Enter": () => runPG() },
      });
      editor.setSize(null, 460);
      getValue = () => editor.getValue();
      setValue = (v) => editor.setValue(v);
    } else {
      const ta = document.createElement("textarea");
      ta.className = "fallback-editor";
      ta.style.minHeight = "460px";
      ta.value = initial;
      ta.addEventListener("keydown", (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key === "Enter") {
          e.preventDefault();
          runPG();
        }
      });
      mount.appendChild(ta);
      getValue = () => ta.value;
      setValue = (v) => (ta.value = v);
    }

    const consoleEl = document.getElementById("pg-console");
    let busy = false;

    async function runPG() {
      if (busy) return;
      busy = true;
      consoleEl.hidden = false;
      consoleEl.innerHTML = consoleMarkup({ loading: true });
      const res = await runner.run(getValue(), null);
      consoleEl.innerHTML = consoleMarkup(res);
      busy = false;
    }

    document.getElementById("pg-run").addEventListener("click", runPG);
    document.getElementById("pg-clear").addEventListener("click", () => {
      setValue("");
      editor && editor.focus();
      consoleEl.hidden = true;
    });
    app.querySelectorAll("[data-example]").forEach((btn) => {
      btn.addEventListener("click", () => {
        setValue(PG_EXAMPLES[Number(btn.dataset.example)].code);
        consoleEl.hidden = true;
        toast("示例已载入，点运行看看结果。");
      });
    });
  }

  /* ------------------------------------------------------------------
     进度页
     ------------------------------------------------------------------ */
  function renderProgress() {
    const s = overallStats();
    const rows = MODULES.map((mod) => {
      const ms = moduleStats(mod);
      return `<div class="prog-row" style="--accent:${mod.accent}">
        <span class="idx">${mod.index}</span>
        <span class="name">${mod.title}</span>
        <div class="track"><i style="width:${ms.pct}%"></i></div>
        <span class="pct">${ms.pct}%</span>
      </div>`;
    }).join("");

    const doneLessons = ALL_LESSONS.filter((l) => lessonStats(l).done === l.exercises.length);
    const doneProjects = PROJECTS.filter((p) => lessonStats(p).done === p.exercises.length);
    const projectRows = PROJECTS.map((p) => {
      const ps = lessonStats(p);
      return `<a class="prog-row" href="#/project/${p.id}" style="--accent:${p.accent}">
        <span class="idx">${p.index}</span>
        <span class="name">${p.title}</span>
        <div class="track"><i style="width:${ps.pct}%"></i></div>
        <span class="pct">${ps.pct}%</span>
      </a>`;
    }).join("");

    app.innerHTML = `<div class="page">
      <span class="eyebrow">Progress · 本地保存</span>
      <div class="progress-hero">
        <div class="big-ring" style="--p:${s.pct}">
          <div class="big-ring-inner"><b>${s.pct}%</b><span>总完成度</span></div>
        </div>
        <div>
          <h2>${s.done === s.total ? "全部通关，接下来靠你自己的项目了" : "保持手感，比看懂更重要"}</h2>
          <p>进度只存在这台设备的浏览器里。清除站点数据会重置，换设备不会同步。</p>
          <div class="prog-stats">
            <div><b>${s.done}/${s.total}</b><span>练习与检查点</span></div>
            <div><b>${s.lessonsDone}/${ALL_LESSONS.length}</b><span>通关课程</span></div>
            <div><b>${s.projectsDone}/${PROJECTS.length}</b><span>通关项目</span></div>
            <div><b>${s.streak}</b><span>连续学习天数</span></div>
            <div><b>${progress.dates.length}</b><span>累计学习日</span></div>
          </div>
        </div>
      </div>

      <div class="section-head">
        <div><h2>模块进度</h2><p>点任意一行回到对应模块的第一课。</p></div>
      </div>
      <div class="prog-modules">${rows}</div>

      <div class="section-head" style="margin-top:40px">
        <div><h2>项目进度</h2><p>每个项目 4 个里程碑，全部通过才算完成。</p></div>
        <a class="btn btn-outline btn-sm" href="#/projects">项目工坊 →</a>
      </div>
      <div class="prog-modules">${projectRows}</div>

      <div class="section-head" style="margin-top:40px">
        <div><h2>已通关课程</h2><p>${doneLessons.length ? "这些课的练习全部通过。" : "还没有通关的课程，先完成一节。"}</p></div>
      </div>
      <div class="lesson-chips">
        ${
          doneLessons.length
            ? doneLessons
                .map(
                  (l) =>
                    `<a class="lesson-chip done" href="#/lesson/${l.id}"><span class="dot"></span><span>${l.title}</span><span class="go">复习 →</span></a>`
                )
                .join("")
            : `<div class="empty-state">从学习路径里选一节开始。</div>`
        }
      </div>

      <div class="section-head" style="margin-top:40px">
        <div><h2>已通关项目</h2><p>${doneProjects.length ? "这些项目的检查点全部通过，可以开始整理 README 与简历描述了。" : "项目不会自动变完整，选一个开始做。"}</p></div>
      </div>
      <div class="lesson-chips">
        ${
          doneProjects.length
            ? doneProjects
                .map(
                  (p) =>
                    `<a class="lesson-chip done" href="#/project/${p.id}"><span class="dot"></span><span>${p.title}</span><span class="go">回顾 →</span></a>`
                )
                .join("")
            : `<div class="empty-state">从项目工坊里选一个开始。</div>`
        }
      </div>

      <div class="danger-zone">
        <button class="btn btn-outline btn-sm" type="button" id="reset-progress">重置全部进度</button>
        <p>会清除练习通过记录与学习日期，代码不会上传，也没有云端副本。</p>
      </div>
    </div>`;

    document.getElementById("reset-progress").addEventListener("click", () => {
      if (!window.confirm("确定重置所有进度？此操作不可撤销。")) return;
      progress = { done: {}, lessons: {}, last: null, dates: [], celebrated: {} };
      saveProgress();
      toast("进度已重置。");
      renderProgress();
    });
  }

  /* ------------------------------------------------------------------
     路由
     ------------------------------------------------------------------ */
  function setNav(name) {
    document.querySelectorAll("[data-nav]").forEach((a) => a.classList.toggle("active", a.dataset.nav === name));
  }

  function route() {
    const raw = location.hash.replace(/^#\/?/, "");
    const [pathPart, queryPart] = raw.split("?");
    const params = new URLSearchParams(queryPart || "");
    const parts = pathPart.split("/").filter(Boolean);
    cmMap.clear();

    document.getElementById("nav").classList.remove("open");

    if (parts[0] === "lesson" && parts[1]) {
      setNav("");
      document.title = findLesson(parts[1]) ? `${findLesson(parts[1]).title} · JavaForge` : "JavaForge";
      renderLesson(parts[1], params);
      return;
    }

    if (parts[0] === "project" && parts[1]) {
      setNav("projects");
      document.title = findProject(parts[1]) ? `${findProject(parts[1]).title} · JavaForge` : "项目工坊 · JavaForge";
      renderProject(parts[1], params);
      return;
    }

    switch (parts[0]) {
      case "projects":
        setNav("projects");
        document.title = "项目工坊 · JavaForge";
        renderProjects();
        break;
      case "books":
        setNav("books");
        document.title = "书单 · JavaForge";
        renderBooks();
        break;
      case "cheatsheet":
        setNav("cheatsheet");
        document.title = "速查表 · JavaForge";
        renderCheatsheet();
        break;
      case "playground":
        setNav("playground");
        document.title = "自由练习场 · JavaForge";
        renderPlayground();
        break;
      case "progress":
        setNav("progress");
        document.title = "我的进度 · JavaForge";
        renderProgress();
        break;
      default:
        setNav("home");
        document.title = "JavaForge · Java 从基础到进阶训练场";
        renderHome();
        window.scrollTo({ top: 0, behavior: "auto" });
    }
  }

  /* ------------------------------------------------------------------
     全局交互
     ------------------------------------------------------------------ */
  document.addEventListener("click", (e) => {
    const downloadBtn = e.target.closest("[data-download]");
    if (downloadBtn) {
      const file = fileRegistry.get(downloadBtn.dataset.download);
      if (file) {
        const blob = new Blob([file.code], { type: "text/plain;charset=utf-8" });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = file.filename;
        document.body.appendChild(a);
        a.click();
        a.remove();
        setTimeout(() => URL.revokeObjectURL(url), 1000);
        toast("已下载 " + file.filename);
      }
    }

    const copyBtn = e.target.closest("[data-copy]");
    if (copyBtn) {
      const host = copyBtn.closest(".cheat-item") || copyBtn.closest(".codeblock");
      const pre = host && host.querySelector("pre");
      const text = pre ? pre.innerText : "";
      const done = () => toast("已复制到剪贴板");
      if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(text).then(done).catch(() => toast("复制失败，请手动选择", "error"));
      } else {
        const ta = document.createElement("textarea");
        ta.value = text;
        document.body.appendChild(ta);
        ta.select();
        document.execCommand("copy");
        ta.remove();
        done();
      }
    }

    const navBtn = e.target.closest("#nav-toggle");
    if (navBtn) document.getElementById("nav").classList.toggle("open");

    const link = e.target.closest("a[href^='#']");
    if (link) document.getElementById("nav").classList.remove("open");
  });

  window.addEventListener("hashchange", route);

  runner.health();

  if (location.protocol === "file:") {
    document.getElementById("file-warning").hidden = false;
  }

  if (!MODULES.length) {
    app.innerHTML = `<div class="page"><div class="empty-state">课程数据未加载。请确认 assets/js/data 下的文件存在。</div></div>`;
    return;
  }

  try {
    route();
  } catch (err) {
    console.error(err);
    app.innerHTML = `<div class="page"><div class="callout warn">
      <span class="co-icon">!</span>
      <p><span class="co-title">页面渲染失败</span>${esc(err && err.message ? err.message : String(err))}</p>
    </div></div>`;
  }
})();
