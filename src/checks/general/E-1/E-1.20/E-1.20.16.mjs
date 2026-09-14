import { findMonolithViolations } from "./find-monolith-violations.mjs";
import { fail, pass } from "../../../check-result.mjs";

export const ruleId = "E-1.20.16";
export const parentRuleId = "E-1.20";

export async function run({ root }) {
  let sourceViolations;
  let testViolations;
  try {
    [sourceViolations, testViolations] = await Promise.all([
      findMonolithViolations(root, "src", 100),
      findMonolithViolations(root, "tests", 200),
    ]);
  } catch {
    return fail(ruleId, "src/ and tests/ are required for monolith-limit validation.");
  }
  const violations = [...sourceViolations, ...testViolations];
  if (violations.length > 0)
    return fail(ruleId, `Monolith limits exceeded: ${violations.join(", ")}.`);
  return pass(ruleId);
}
