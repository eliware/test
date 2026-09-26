import { findMonolithViolations } from "./find-monolith-violations.mjs";
import { fail, pass } from "../../../check-result.mjs";

export async function runMonolithLimits({ root, ruleId }) {
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
