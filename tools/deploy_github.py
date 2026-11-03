#!/usr/bin/env python3
"""通过 GitHub API 发布站点（适用于 git push 被网络阻断的环境）。

前置条件：gh CLI 已登录（gh auth status 显示 repo 权限）。
用法：
    python tools/deploy_github.py
    python tools/deploy_github.py "feat: update lesson content"

脚本会把当前工作区（排除 .git、缓存、分享包）作为一个完整 tree 提交到
main 分支；如果 Pages 未开启，会自动开启 root 分支发布。
"""

import json
import os
import subprocess
import sys
import tempfile
import time

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
REPO = os.environ.get("GH_REPO", "fkakfjfwfi/javaforge")
BRANCH = "main"
SKIP_DIRS = {".git", ".trae-html-share-packages", ".screenshots", "__pycache__", ".idea", ".vscode", ".venv", "venv"}
SKIP_FILES = {"tools/data.json"}
MESSAGE = sys.argv[1] if len(sys.argv) > 1 else "chore: deploy JavaForge site"


def gh_api(method, endpoint, payload=None, allow_404=False):
    args = ["gh", "api", "--method", method, "repos/%s/%s" % (REPO, endpoint)]
    temp_path = None
    if payload is not None:
        handle = tempfile.NamedTemporaryFile(
            mode="w", suffix=".json", delete=False, encoding="utf-8"
        )
        json.dump(payload, handle, ensure_ascii=False)
        handle.close()
        temp_path = handle.name
        args += ["--input", temp_path]
    try:
        proc = subprocess.run(args, cwd=ROOT, capture_output=True, text=True,
                              encoding="utf-8", errors="replace")
    finally:
        if temp_path:
            os.unlink(temp_path)
    if proc.returncode != 0:
        if allow_404 and ("Not Found" in proc.stderr or "HTTP 404" in proc.stderr
                          or "Git Repository is empty" in proc.stderr):
            return None
        raise SystemExit("GitHub API 失败：%s\n%s" % (" ".join(args), proc.stderr.strip()))
    return json.loads(proc.stdout) if proc.stdout.strip() else None


def collect_files():
    entries = []
    for base, dirs, files in os.walk(ROOT):
        dirs[:] = [d for d in dirs if d not in SKIP_DIRS]
        for name in files:
            full = os.path.join(base, name)
            rel = os.path.relpath(full, ROOT).replace(os.sep, "/")
            if rel in SKIP_FILES or name.endswith(".pyc"):
                continue
            try:
                with open(full, "r", encoding="utf-8") as handle:
                    content = handle.read()
            except UnicodeDecodeError:
                print("跳过二进制文件：%s" % rel)
                continue
            entries.append({
                "path": rel,
                "mode": "100755" if name.endswith(".py") else "100644",
                "type": "blob",
                "content": content,
            })
    return entries


def bootstrap_readme():
    """空仓库不能直接建 tree，先用 Contents API 创建首个提交。"""
    import base64
    path = os.path.join(ROOT, "README.md")
    with open(path, "r", encoding="utf-8") as handle:
        text = handle.read()
    gh_api("PUT", "contents/README.md", {
        "message": "chore: init repository",
        "content": base64.b64encode(text.encode("utf-8")).decode("ascii"),
    })
    print("已创建初始提交，继续发布完整站点。")


def main():
    entries = collect_files()
    print("准备发布 %d 个文件到 %s" % (len(entries), REPO))

    ref = gh_api("GET", "git/ref/heads/%s" % BRANCH, allow_404=True)
    if not ref:
        bootstrap_readme()
        ref = gh_api("GET", "git/ref/heads/%s" % BRANCH)
    parent = ref["object"]["sha"] if ref else None

    tree = gh_api("POST", "git/trees", {"tree": entries})
    commit = gh_api("POST", "git/commits", {
        "message": MESSAGE,
        "tree": tree["sha"],
        "parents": [parent] if parent else [],
    })

    if ref:
        gh_api("PATCH", "git/refs/heads/%s" % BRANCH, {"sha": commit["sha"]})
    else:
        gh_api("POST", "git/refs", {"ref": "refs/heads/%s" % BRANCH, "sha": commit["sha"]})

    print("提交完成：https://github.com/%s/commit/%s" % (REPO, commit["sha"]))

    pages = gh_api("GET", "pages", allow_404=True)
    if not pages:
        gh_api("POST", "pages", {"source": {"branch": BRANCH, "path": "/"}})
        print("已开启 GitHub Pages（main / root），首次构建通常需要 1–2 分钟。")
    else:
        print("Pages 已存在：%s" % pages.get("html_url", ""))

    for _ in range(20):
        pages = gh_api("GET", "pages", allow_404=True)
        if pages and pages.get("status") == "built":
            print("Pages 构建完成：%s" % pages.get("html_url"))
            return 0
        print("等待 Pages 构建…（%s）" % (pages or {}).get("status", "unknown"))
        time.sleep(8)
    print("构建仍在进行，稍后访问 Pages 地址即可。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
