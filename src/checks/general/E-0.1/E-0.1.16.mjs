import { fail, pass } from "../../check-result.mjs";
import { parse } from "semver";

export const ruleId = "E-0.1.16";
export const parentRuleId = "E-0.1";

export function run({ packageJson }) {
  const version = parse(packageJson?.version);
  return version?.major === 9 && version.minor === 0
    ? pass(ruleId)
    : fail(ruleId, "Release versions must align with the v9 convention baseline.");
}
