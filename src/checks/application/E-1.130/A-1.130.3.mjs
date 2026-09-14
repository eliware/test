import { fail, pass } from "../../check-result.mjs";

export const ruleId = "A-1.130.3";
export const parentRuleId = "E-1.130";

export function run({ packageJson }) {
  const hasEntrypoint =
    typeof packageJson?.main === "string" ||
    Object.keys(packageJson?.bin ?? {}).length > 0 ||
    typeof packageJson?.scripts?.start === "string";
  if (!hasEntrypoint)
    return fail(ruleId, "Application package.json must declare a runtime or start entrypoint.");
  if (typeof packageJson?.private !== "boolean")
    return fail(
      ruleId,
      "Application package.json must declare private/public distribution status.",
    );
  return pass(ruleId);
}
