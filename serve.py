#!/usr/bin/env python3
"""JavaForge 本地服务器

静态文件 + /api/run：把浏览器里的代码写到临时目录，用本机 JDK 编译执行。
只用 Python 标准库，需要本机安装 JDK 17+（javac / java 在 PATH 上）。

    python serve.py            # http://127.0.0.1:8000
    python serve.py 8080
"""

import json
import os
import shutil
import subprocess
import sys
import tempfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer

ROOT = os.path.dirname(os.path.abspath(__file__))
COMPILE_TIMEOUT = 30
RUN_TIMEOUT = 12
MAX_BODY = 300_000

JUDGE_HEADER = """import java.math.BigDecimal;
import java.util.*;
import java.util.stream.*;
import java.time.*;
import java.util.concurrent.*;
import java.util.concurrent.atomic.*;
import java.util.function.*;
import java.io.*;
import java.nio.file.*;

public class Judge {
    static void check(boolean ok, String msg) {
        if (!ok) throw new AssertionError(msg);
    }
    static void eq(Object actual, Object expected, String msg) {
        if (!Objects.equals(actual, expected))
            throw new AssertionError(msg + "\\n期望：" + expected + "\\n实际：" + actual);
    }
    static void near(double actual, double expected, double eps, String msg) {
        if (Math.abs(actual - expected) > eps)
            throw new AssertionError(msg + "\\n期望：" + expected + " ± " + eps + "\\n实际：" + actual);
    }
    public static void main(String[] args) throws Exception {
"""

JUDGE_FOOTER = """        System.out.println("通过：所有断言成立");
    }
}
"""


def find_tool(name):
    """javac / java 可能不在 PATH（IDE 自带 JDK），再查 JAVA_HOME。"""
    path = shutil.which(name)
    if path:
        return path
    java_home = os.environ.get("JAVA_HOME")
    if java_home:
        candidate = os.path.join(java_home, "bin", name + (".exe" if os.name == "nt" else ""))
        if os.path.exists(candidate):
            return candidate
    return None


JAVAC = find_tool("javac")
JAVA = find_tool("java")


def run_java(payload):
    code = payload.get("code") or ""
    check_body = payload.get("check") or ""
    stdin = payload.get("stdin") or ""

    if not code.strip():
        return {"ok": False, "out": "", "error": "代码为空。", "phase": "input"}
    if not JAVAC or not JAVA:
        return {
            "ok": False,
            "out": "",
            "error": "没有找到 javac / java。请安装 JDK 17 或更高版本，并确认 bin 目录在 PATH 上。",
            "phase": "env",
        }

    work = tempfile.mkdtemp(prefix="javaforge-")
    try:
        with open(os.path.join(work, "Main.java"), "w", encoding="utf-8") as f:
            f.write(code)

        has_check = bool(check_body.strip())
        if has_check:
            with open(os.path.join(work, "Judge.java"), "w", encoding="utf-8") as f:
                f.write(JUDGE_HEADER + check_body + "\n" + JUDGE_FOOTER)

        classes = os.path.join(work, "classes")
        os.mkdir(classes)

        sources = ["Main.java"] + (["Judge.java"] if has_check else [])
        compile_cmd = [JAVAC, "-encoding", "UTF-8", "-d", classes] + sources
        try:
            proc = subprocess.run(
                compile_cmd, cwd=work, capture_output=True, text=True,
                encoding="utf-8", errors="replace", timeout=COMPILE_TIMEOUT,
            )
        except subprocess.TimeoutExpired:
            return {"ok": False, "out": "", "error": "编译超时（30 秒）。", "phase": "compile"}

        if proc.returncode != 0:
            return {
                "ok": False,
                "out": "",
                "error": (proc.stderr or proc.stdout or "编译失败").strip(),
                "phase": "compile",
            }

        main_class = "Judge" if has_check else "Main"
        run_cmd = [JAVA, "-Dfile.encoding=UTF-8", "-Dstdout.encoding=UTF-8", "-cp", classes, main_class]
        try:
            proc = subprocess.run(
                run_cmd, cwd=work, input=stdin, capture_output=True, text=True,
                encoding="utf-8", errors="replace", timeout=RUN_TIMEOUT,
            )
        except subprocess.TimeoutExpired:
            return {
                "ok": False,
                "out": "",
                "error": "运行超时（%d 秒），进程已终止。检查一下是不是写出了死循环，或者线程没有退出。" % RUN_TIMEOUT,
                "phase": "run",
                "timedOut": True,
            }

        out = proc.stdout or ""
        err = proc.stderr or ""
        ok = proc.returncode == 0
        if has_check and ok and "通过：所有断言成立" not in out:
            err = err or "判题脚本没有正常结束。"
            ok = False
        return {"ok": ok, "out": out, "error": err, "phase": "run", "exit": proc.returncode}
    finally:
        shutil.rmtree(work, ignore_errors=True)


class Handler(SimpleHTTPRequestHandler):
    server_version = "JavaForge/1.0"

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=ROOT, **kwargs)

    def _json(self, payload, status=200):
        body = json.dumps(payload, ensure_ascii=False).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("Access-Control-Allow-Origin", "*")
        self.end_headers()
        self.wfile.write(body)

    def do_OPTIONS(self):
        self.send_response(204)
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()

    def do_GET(self):
        if self.path.split("?")[0] == "/api/health":
            self._json({
                "ok": bool(JAVAC and JAVA),
                "javac": JAVAC or "",
                "java": JAVA or "",
                "version": sys.version.split()[0],
            })
            return
        super().do_GET()

    def do_POST(self):
        if self.path.split("?")[0] != "/api/run":
            self._json({"ok": False, "error": "未知接口"}, 404)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
        except ValueError:
            length = 0
        if length <= 0 or length > MAX_BODY:
            self._json({"ok": False, "error": "请求体为空或过大"}, 413)
            return
        raw = self.rfile.read(length)
        try:
            payload = json.loads(raw.decode("utf-8"))
        except (UnicodeDecodeError, json.JSONDecodeError):
            self._json({"ok": False, "error": "请求不是合法 JSON"}, 400)
            return
        try:
            result = run_java(payload)
        except Exception as exc:  # noqa: BLE001 - 服务端兜底，避免一个坏请求杀掉进程
            result = {"ok": False, "out": "", "error": "服务器执行失败：%s" % exc, "phase": "server"}
        self._json(result)

    def log_message(self, fmt, *args):
        if self.path.startswith("/api/"):
            sys.stderr.write("[api] " + fmt % args + "\n")


def main():
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    if not JAVAC or not JAVA:
        print("警告：没有找到 javac / java，练习判题将不可用。请安装 JDK 17+ 并配置 PATH。")
    else:
        try:
            version = subprocess.run([JAVAC, "-version"], capture_output=True, text=True, timeout=10)
            print("Java 编译器：" + (version.stdout or version.stderr).strip())
        except Exception:  # noqa: BLE001
            pass
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    print("JavaForge 已启动：http://127.0.0.1:%d" % port)
    print("按 Ctrl+C 停止。")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\n已停止。")
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
