import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.40.5";
export const parentRuleId = "E-1.40";

export function run({ packageJson }) {
  if (!packageJson?.exports && !packageJson?.main) {
    return fail(ruleId, "Libraries must declare package exports or a public main entrypoint.");
  }
  if (!Array.isArray(packageJson.files) || packageJson.files.length === 0) {
    return fail(ruleId, "Libraries must declare an intentional package file allowlist.");
  }
  return pass(ruleId);
}
