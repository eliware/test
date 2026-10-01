import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findRepositoryFiles } from "../find-repository-files.mjs";
import { hasDirectCommandToolUse } from "./has-direct-command-tool-use.mjs";
import { hasDirectJavaScriptToolUse } from "./has-direct-javascript-tool-use.mjs";

const inspectable =
  /(?:^|\/)(?:\.github|\.knit|bin|scripts|src|test|tests)(?:\/|$)|\.(?:mjs|js|cjs|ts|tsx|sh|ps1|ya?ml)$/i;
const javascript = /\.(?:mjs|js|cjs|ts|tsx)$/i;
export async function findDirectToolUses(root, files, readText) {
  const findings = [];
  for (const file of files ?? (await findRepositoryFiles(root))) {
    if (file === "package.json" || !inspectable.test(file)) continue;
    const content = readText
      ? await readText(join(root, file))
      : await readFile(join(root, file), "utf8");
    if (javascript.test(file)) {
      const isTest = /^tests?\//.test(file.replaceAll("\\", "/"));
      if (hasDirectJavaScriptToolUse(content, isTest)) findings.push(file);
    } else if (hasDirectCommandToolUse(file, content)) findings.push(file);
  }
  return findings;
}
