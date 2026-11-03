#!/usr/bin/env python3
"""逐题验证：所有 starter 能编译，所有 solution 能通过判题脚本。

用法：
    python serve.py 8001        # 另开一个终端
    python tools/verify.py http://127.0.0.1:8001
"""

import json
import os
import subprocess
import sys
import urllib.request
from concurrent.futures import ThreadPoolExecutor

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
BASE = sys.argv[1] if len(sys.argv) > 1 else "http://127.0.0.1:8001"


def load_data():
    proc = subprocess.run(["node", "tools/dump-data.js"], cwd=ROOT, capture_output=True)
    if proc.returncode != 0:
        raise SystemExit(proc.stderr.decode("utf-8", "replace"))
    return json.loads(proc.stdout.decode("utf-8"))


def call(payload):
    data = json.dumps(payload, ensure_ascii=False).encode("utf-8")
    req = urllib.request.Request(
        BASE.rstrip("/") + "/api/run",
        data=data,
        headers={"Content-Type": "application/json"},
        method="POST",
    )
    with urllib.request.urlopen(req, timeout=90) as res:
        return json.loads(res.read().decode("utf-8"))


def check_exercise(ex):
    errors = []
    if ex["kind"] == "quiz":
        if not (0 <= ex.get("answer", -1) < len(ex.get("options", []))):
            errors.append("quiz answer 越界")
        return errors

    solution = ex.get("solution", "")
    starter = ex.get("starter", "")
    if not solution.strip():
        errors.append("缺少 solution")
        return errors

    result = call({"code": solution, "check": ex.get("check", "")})
    if not result.get("ok"):
        errors.append("solution 未通过：" + (result.get("error") or "")[:1200])

    result = call({"code": starter, "check": ""})
    if result.get("phase") == "compile":
        errors.append("starter 编译失败：" + (result.get("error") or "")[:800])
    return errors


def main():
    data = load_data()
    exercises = []
    for mod in data["modules"]:
        for lesson in mod["lessons"]:
            for ex in lesson["exercises"]:
                exercises.append(("%s/%s" % (lesson["id"], ex["id"]), ex))
    for project in data["projects"]:
        for ex in project["exercises"]:
            exercises.append(("%s/%s" % (project["id"], ex["id"]), ex))

    ids = [k for k, _ in exercises]
    dupes = sorted({i for i in ids if ids.count(i) > 1})
    if dupes:
        print("重复 ID：", dupes)
        return 1

    code_count = sum(1 for _, ex in exercises if ex["kind"] == "code")
    quiz_count = len(exercises) - code_count
    print("课程：%d 节；项目：%d 个" % (
        sum(len(m["lessons"]) for m in data["modules"]), len(data["projects"])))
    print("练习：%d（编码 %d / 自测 %d）" % (len(exercises), code_count, quiz_count))

    failures = []
    with ThreadPoolExecutor(max_workers=4) as pool:
        futures = {pool.submit(check_exercise, ex): key for key, ex in exercises}
        for future in futures:
            key = futures[future]
            try:
                errors = future.result()
            except Exception as exc:  # noqa: BLE001
                errors = ["验证异常：%s" % exc]
            if errors:
                failures.append((key, errors))
                print("FAIL", key)
                for err in errors:
                    print("   ", err.replace("\n", "\n    ")[:1400])
            else:
                print("PASS", key)

    print("\n==== 结果 ====")
    print("通过 %d / %d" % (len(exercises) - len(failures), len(exercises)))
    if failures:
        print("失败清单：")
        for key, errors in failures:
            print(" -", key)
        return 1
    print("全部通过。")
    return 0


if __name__ == "__main__":
    sys.exit(main())
