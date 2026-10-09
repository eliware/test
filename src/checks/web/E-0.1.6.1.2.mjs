import { fail, pass } from "../check-result.mjs";
import { validateBrowserTooling } from "./E-0.1.6.1.2/validate-browser-tooling.mjs";

export const ruleId = "E-0.1.6.1.2";

export function run({ packageJson = {} } = {}) {
  const errors = validateBrowserTooling(packageJson);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
