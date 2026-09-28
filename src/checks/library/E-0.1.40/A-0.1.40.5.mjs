import { access } from "node:fs/promises";
import { resolve } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { collectLibraryExportTargets } from "./collect-library-export-targets.mjs";

export const ruleId = "A-0.1.40.5";
export const parentRuleId = "E-0.1.40";

async function requireFiles(root, paths, label) {
  const failures = [];
  for (const path of paths) {
    if (path.startsWith("./") === false || path.includes("*") || path.includes("[")) continue;
    try {
      await access(resolve(root, path));
    } catch {
      failures.push(`${label} target does not exist: ${path}`);
    }
  }
  return failures.length ? failures.join("\n") : null;
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
      ? collectLibraryExportTargets(packageJson.exports)
      : [packageJson.main];
    const entryError = await requireFiles(root, entryTargets, "Library entrypoint");
    const failures = entryError ? [entryError] : [];
    const declarationTargets = [packageJson.types, packageJson.typings].filter(Boolean);
    if (packageJson.exports)
      declarationTargets.push(
        ...collectLibraryExportTargets(packageJson.exports).filter((target) =>
          target.endsWith(".d.ts"),
        ),
      );
    const declarationError = await requireFiles(root, declarationTargets, "Library declaration");
    if (declarationError) failures.push(declarationError);
    if (failures.length) return fail(ruleId, failures.join("\n"));
  }
  return pass(ruleId);
}
