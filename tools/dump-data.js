/* 把 assets/js/data 下的课程数据导出为 JSON，供 tools/verify.py 逐题编译验证。 */
const fs = require("fs");
const path = require("path");
const vm = require("vm");

const root = path.resolve(__dirname, "..");
const dataDir = path.join(root, "assets", "js", "data");
const window = { CURRICULUM: { modules: [] }, PROJECTS: [], BOOKS: [], CHEATSHEET: [] };
const context = vm.createContext({ window, console });

const files = fs.readdirSync(dataDir).filter((f) => f.endsWith(".js")).sort();
for (const file of files) {
  const full = path.join(dataDir, file);
  vm.runInContext(fs.readFileSync(full, "utf8"), context, { filename: full });
}

process.stdout.write(
  JSON.stringify(
    {
      modules: window.CURRICULUM.modules,
      projects: window.PROJECTS,
      books: window.BOOKS,
      cheatsheet: window.CHEATSHEET,
    },
    null,
    2
  )
);
