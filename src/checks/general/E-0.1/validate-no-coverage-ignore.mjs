import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { findPureBarrels, isPureBarrelSource } from "./E-0.1.20/find-pure-barrels.mjs";
import { findLibraryEntryPoints } from "./E-0.1.5/find-library-entrypoints.mjs";
import { findSourceFiles } from "./find-source-files.mjs";
import { hasIstanbulIgnoreDirective } from "./E-0.1.5/read-istanbul-ignore.mjs";

export async function runNoCoverageIgnore({
  root,
  ruleId,
  packageJson,
  repositoryInventory,
  findBarrels = findPureBarrels,
  isPureBarrel = isPureBarrelSource,
}) {
  try {
    const sourceRoot = join(root, "src");
    const files = repositoryInventory
      ? (await repositoryInventory.entriesUnder(sourceRoot))
          .filter(({ path, type }) => type === "file" && /\.(?:mjs|js|cjs|ts|tsx)$/u.test(path))
          .map(({ path }) => join(root, path))
      : await findSourceFiles(sourceRoot);
    const barrels = new Set(await findBarrels(root, undefined, repositoryInventory));
    const allowedBarrels = new Set(findLibraryEntryPoints(packageJson));
    for (const file of files) {
      const source = repositoryInventory ? await repositoryInventory.readText(file) : await readFile(file, "utf8");
      const relativePath = file.slice(root.length + 1).replaceAll("\\", "/");
      if (
        hasIstanbulIgnoreDirective(source) &&
        !(barrels.has(relativePath) && allowedBarrels.has(relativePath))
      ) {
        return fail(ruleId, `Coverage-ignore directives are not allowed: ${relativePath}.`);
      }
      if (barrels.has(relativePath) && !isPureBarrel(source)) {
        return fail(ruleId, `Pure-barrel classification changed while scanning: ${relativePath}.`);
      }
    }
    return pass(ruleId);
  } catch (error) {
    return fail(ruleId, error.message);
  }
}
