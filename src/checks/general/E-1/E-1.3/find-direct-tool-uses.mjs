import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { findRepositoryFiles } from "../find-repository-files.mjs";

const inspectable =
  /(?:^|\/)(?:\.github|\.knit|bin|scripts|src|test|tests)(?:\/|$)|\.(?:mjs|js|cjs|ts|tsx|sh|ps1|ya?ml)$/i;
const directCommand =
  /(?:^|[\s"'`=(:,/])(?:(?:npx|npm\s+(?:exec|run))\s+(?:[^\s;&|]+\s+)*)?(?:jest|oxlint|prettier)(?=$|[\s"'`=:;,)&|])/i;
const directImport =
  /(?:\bfrom\s*|\bimport\s*(?:\(\s*)?|\brequire\s*\(\s*)["'](?:@jest\/|jest(?:\/|["'])|oxlint(?:["']|\/)|prettier(?:["']|\/))/i;

export async function findDirectToolUses(root, files = null) {
  const findings = [];
  for (const file of files ?? (await findRepositoryFiles(root))) {
    if (file === "package.json" || !inspectable.test(file)) continue;
    const content = await readFile(join(root, file), "utf8");
    if (directCommand.test(content) || directImport.test(content)) findings.push(file);
  }
  return findings;
}
