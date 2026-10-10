import { fail, pass } from "../check-result.mjs";
import { validateNpmPackageFiles } from "./E-0.1.10.1.1/validate-npm-package-files.mjs";

export const ruleId = "E-0.1.10.1.1";

export function run(context = {}) {
  const errors = validateNpmPackageFiles(context.packageJson);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
