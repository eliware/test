import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { validateLockfileShape } from "./validate-lockfile-shape.mjs";
import { validateLockfileDependencies } from "./validate-lockfile-dependencies.mjs";

export const ruleId = "E-1.20.6";
export const parentRuleId = "E-1.20";

export async function run({ root, packageJson }) {
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
  return pass(ruleId);
}
