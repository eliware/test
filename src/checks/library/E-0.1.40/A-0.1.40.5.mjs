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

function isSrcTarget(target) {
  return typeof target === "string" && target.startsWith("./src/");
}

export async function run({ root, packageJson }) {
  if (!packageJson?.exports && !packageJson?.main) {
    return fail(ruleId, "Libraries must declare package exports or a public main entrypoint.");
  }
  if (!Array.isArray(packageJson.files) || packageJson.files.length === 0) {
    return fail(ruleId, "Libraries must declare an intentional package file allowlist.");
  }
  const entryTargets = packageJson.exports
    ? collectLibraryExportTargets(packageJson.exports)
    : [packageJson.main];
  const declarationTargets = [packageJson.types, packageJson.typings].filter(Boolean);
  if (packageJson.exports)
    declarationTargets.push(...entryTargets.filter((target) => target.endsWith(".d.ts")));
  const outsideSrc = [...entryTargets, ...declarationTargets].filter(
    (target) => !isSrcTarget(target),
  );
  if (outsideSrc.length)
    return fail(
      ruleId,
      `Library runtime entrypoints and declarations must target files under src/: ${outsideSrc.join(", ")}`,
    );
  if (root) {
    const entryError = await requireFiles(root, entryTargets, "Library entrypoint");
    const failures = entryError ? [entryError] : [];
    const declarationError = await requireFiles(root, declarationTargets, "Library declaration");
    if (declarationError) failures.push(declarationError);
    if (failures.length) return fail(ruleId, failures.join("\n"));
  }
  return pass(ruleId);
}
