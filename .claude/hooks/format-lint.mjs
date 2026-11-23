// PostToolUse hook: formatea con Prettier y corrige con ESLint el archivo escrito/editado por Claude.
import { spawnSync } from "node:child_process";
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import path from "node:path";
const projectDir = path.resolve(
  process.env.CLAUDE_PROJECT_DIR || process.cwd(),
);
let raw = "";
for await (const chunk of process.stdin) raw += chunk;
let filePath;
try {
  filePath = JSON.parse(raw)?.tool_input?.file_path;
} catch {
  process.exit(0);
}
if (!filePath) process.exit(0);
const abs = path.resolve(filePath);
const rel = path.relative(projectDir, abs);
if (rel.startsWith("..") || path.isAbsolute(rel)) process.exit(0);
const first = rel.split(path.sep)[0];
if (["node_modules", ".next", "references", "out", "build"].includes(first))
  process.exit(0);
const run = (args) =>
  spawnSync("npx", ["--no-install", ...args], {
    cwd: projectDir,
    encoding: "utf8",
    shell: process.platform === "win32",
  });
const isScript = /\.(m|c)?(j|t)sx?$/.test(abs);
const isCode = isScript || /\.(css|scss|json)$/.test(abs);
// Código: elimina líneas vacías para dejarlo compacto (Markdown no: ahí separan párrafos).
if (isCode && existsSync(abs)) {
  const src = readFileSync(abs, "utf8");
  const compact = src.replace(/^[ \t]*\r?\n/gm, "");
  if (compact !== src) writeFileSync(abs, compact);
}
run(["prettier", "--write", "--ignore-unknown", `"${abs}"`]);
if (isScript) {
  const res = run(["eslint", "--fix", `"${abs}"`]);
  if (res.status !== 0) {
    process.stderr.write(
      `ESLint encontró problemas en ${rel}:\n${res.stdout}${res.stderr}`,
    );
    process.exit(2);
  }
}
process.exit(0);
