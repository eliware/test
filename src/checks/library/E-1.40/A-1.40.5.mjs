import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.40.5";
export const parentRuleId = "E-1.40";

export function exportTargets(value, targets = []) {
  if (typeof value === "string") targets.push(value);
  else if (Array.isArray(value)) value.forEach((entry) => exportTargets(entry, targets));
  else if (value && typeof value === "object") Object.values(value).forEach((entry) => exportTargets(entry, targets));
  return targets;
}

async function requireFiles(root, paths, label) {
  for (const path of paths) {
    if (path.startsWith("./") === false || path.includes("*") || path.includes("[")) continue;
    try {
      await access(resolve(root, path));
    } catch {
      return `${label} target does not exist: ${path}`;
    }
  }
  return null;
}

export async function run({ root, packageJson }) {
  if (!packageJson?.exports && !packageJson?.main) {
    return fail(ruleId, "Libraries must declare package exports or a public main entrypoint.");
  }
  if (!Array.isArray(packageJson.files) || packageJson.files.length === 0) {
    return fail(ruleId, "Libraries must declare an intentional package file allowlist.");
  }
  if (root) {
    const entryTargets = packageJson.exports
      ? exportTargets(packageJson.exports)
      : [packageJson.main];
    const entryError = await requireFiles(root, entryTargets, "Library entrypoint");
    if (entryError) return fail(ruleId, entryError);
    const declarationTargets = [packageJson.types, packageJson.typings].filter(Boolean);
    if (packageJson.exports) declarationTargets.push(...exportTargets(packageJson.exports).filter((target) => target.endsWith(".d.ts")));
    const declarationError = await requireFiles(root, declarationTargets, "Library declaration");
    if (declarationError) return fail(ruleId, declarationError);
  }
  return pass(ruleId);
}
