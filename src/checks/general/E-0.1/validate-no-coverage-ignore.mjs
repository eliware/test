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
    const profiles = packageJson?.eliware?.apply ?? [];
    const barrelExemptProfiles = profiles.filter(
      (profile) => profile === "application" || profile === "library",
    );
    const allowedBarrels = new Set(
      barrelExemptProfiles.length
        ? findLibraryEntryPoints({
            ...packageJson,
            eliware: { ...packageJson.eliware, apply: [...profiles, "library"] },
          })
        : [],
    );
    const failures = [];
    for (const file of files) {
      const relativePath = file.slice(root.length + 1).replaceAll("\\", "/");
      let source;
      try {
        source = repositoryInventory
          ? await repositoryInventory.readText(file)
          : await readFile(file, "utf8");
      } catch (error) {
        failures.push(`${relativePath} could not be inspected: ${error.message}`);
        continue;
      }
      if (
        hasIstanbulIgnoreDirective(source) &&
        !(barrels.has(relativePath) && allowedBarrels.has(relativePath))
      ) {
        failures.push(`Coverage-ignore directives are not allowed: ${relativePath}.`);
      }
      if (barrels.has(relativePath) && !isPureBarrel(source)) {
        failures.push(`Pure-barrel classification changed while scanning: ${relativePath}.`);
      }
    }
    return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
  } catch (error) {
    return fail(ruleId, error.message);
  }
}
