import { fail, pass } from "../../check-result.mjs";
import { hasApplicationEntrypoint } from "./has-application-entrypoint.mjs";

export const ruleId = "A-0.1.130.3";
export const parentRuleId = "E-0.1.130";

export function run({ packageJson, root = process.cwd() }) {
  if (!hasApplicationEntrypoint(packageJson, root))
    return fail(
      ruleId,
      "Application package.json must declare an existing runtime file entrypoint under bin/.",
    );
  if (typeof packageJson?.private !== "boolean")
    return fail(
      ruleId,
      "Application package.json must declare private/public distribution status.",
    );
  return pass(ruleId);
}
