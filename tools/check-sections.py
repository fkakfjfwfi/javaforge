#!/usr/bin/env python3
"""开发辅助：编译课程正文中的完整 Java 示例与项目的参考实现。

正文里的 example 有些是片段（方法体、配置），只检查包含 public class 的完整文件；
项目 files 则按项目分组一起编译（它们通过 package 互相引用）。
"""

import json
import os
import re
import shutil
import subprocess
import sys
import tempfile

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_data():
    proc = subprocess.run(["node", "tools/dump-data.js"], cwd=ROOT, capture_output=True)
    if proc.returncode != 0:
        raise SystemExit(proc.stderr.decode("utf-8", "replace"))
    return json.loads(proc.stdout.decode("utf-8"))


def compile_files(files, label):
    work = tempfile.mkdtemp(prefix="jf-sections-")
    try:
        names = []
        for i, (name, code) in enumerate(files):
            filename = name if name.endswith(".java") else "Snippet%d.java" % i
            path = os.path.join(work, filename)
            rel_dir = os.path.dirname(filename)
            if rel_dir:
                os.makedirs(os.path.join(work, rel_dir), exist_ok=True)
            with open(path, "w", encoding="utf-8") as f:
                f.write(code)
            names.append(filename)
        proc = subprocess.run(
            ["javac", "-encoding", "UTF-8", "-d", os.path.join(work, "out")] + names,
            cwd=work, capture_output=True, text=True, encoding="utf-8", errors="replace", timeout=60,
        )
        if proc.returncode != 0:
            return proc.stderr
        return None
    finally:
        shutil.rmtree(work, ignore_errors=True)


def main():
    data = load_data()
    failures = []
    checked = 0

    for mod in data["modules"]:
        for lesson in mod["lessons"]:
            for idx, section in enumerate(lesson.get("sections", [])):
                if section.get("type") != "code":
                    continue
                code = section.get("code", "")
                if "public class " not in code:
                    continue
                match = re.search(r"public class (\w+)", code)
                name = (match.group(1) + ".java") if match else "Snippet.java"
                checked += 1
                err = compile_files([(name, code)], "%s/%s#%d" % (mod["id"], lesson["id"], idx))
                if err:
                    failures.append(("%s/%s 第 %d 个代码块" % (mod["id"], lesson["id"], idx + 1), err))

    for project in data["projects"]:
        files = [(f["name"], f["code"]) for f in project.get("files", []) if f.get("lang", "java") == "java"]
        if not files:
            continue
        checked += 1
        err = compile_files(files, project["id"])
        if err:
            failures.append(("项目 " + project["id"] + " 参考实现", err))

    print("检查 %d 组完整 Java 代码" % checked)
    for label, err in failures:
        print("FAIL", label)
        print(err.strip()[:1500])
    print("失败 %d 组" % len(failures))
    return 1 if failures else 0


if __name__ == "__main__":
    sys.exit(main())
