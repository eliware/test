import { findMonolithViolations } from "./find-monolith-violations.mjs";
import { fail, pass } from "../../../check-result.mjs";

export async function runMonolithLimits({ root, ruleId, repositoryInventory, requireTests = false }) {
  let sourceViolations;
  try {
    sourceViolations = await findMonolithViolations(root, "src", 100, repositoryInventory);
  } catch {
    return fail(ruleId, "src/ is required for monolith-limit validation.");
  }
  let testViolations = [];
  if (requireTests) {
    try {
      testViolations = await findMonolithViolations(root, "tests", 200, repositoryInventory);
    } catch {
      return fail(ruleId, "tests/ is required for monolith-limit validation.");
    }
  }
  const violations = [...sourceViolations, ...testViolations];
  if (violations.length > 0)
    return fail(ruleId, `Monolith limits exceeded: ${violations.join(", ")}.`);
  return pass(ruleId);
}
