import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { regeneratedLockfileMatches } from "./regenerated-lockfile-matches.mjs";
import { validateLockfileShape } from "./validate-lockfile-shape.mjs";
import { validateLockfileDependencies } from "./validate-lockfile-dependencies.mjs";
import { validateRegeneratedLockfile } from "./validate-regenerated-lockfile.mjs";

export const ruleId = "E-1.20.6";
export const parentRuleId = "E-1.20";

export async function run({ root, packageJson, regeneratedMatches = regeneratedLockfileMatches }) {
  let lockfile;
  try {
    lockfile = JSON.parse(await readFile(join(root, "package-lock.json"), "utf8"));
  } catch {
    return fail(
      ruleId,
      "package-lock.json is required and must be valid JSON for npm repositories.",
    );
  }
  const shapeError = validateLockfileShape(lockfile, packageJson);
  if (shapeError) return fail(ruleId, shapeError);
  const dependencyError = validateLockfileDependencies(lockfile, packageJson);
  if (dependencyError) return fail(ruleId, dependencyError);
  const regenerationError = await validateRegeneratedLockfile(packageJson, lockfile, regeneratedMatches);
  if (regenerationError) return fail(ruleId, regenerationError);
  return pass(ruleId);
}
