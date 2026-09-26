import { findMonolithViolations } from "./find-monolith-violations.mjs";
import { fail, pass } from "../../../check-result.mjs";

export async function runMonolithLimits({ root, ruleId, repositoryInventory, requireTests = false }) {
  let sourceViolations;
  try {
    sourceViolations = await findMonolithViolations(root, "src", 100, repositoryInventory);
  } catch (error) {
    if (error.code === "ENOENT") return fail(ruleId, "src/ is required for monolith-limit validation.");
    return fail(ruleId, `Could not validate src/ monolith limits: ${error.message}`);
  }
  let testViolations = [];
  if (requireTests) {
    try {
      testViolations = await findMonolithViolations(root, "tests", 200, repositoryInventory);
    } catch (error) {
      if (error.code === "ENOENT") return fail(ruleId, "tests/ is required for monolith-limit validation.");
      return fail(ruleId, `Could not validate tests/ monolith limits: ${error.message}`);
    }
  }
  const violations = [...sourceViolations, ...testViolations];
  if (violations.length > 0)
    return fail(ruleId, `Monolith limits exceeded: ${violations.join(", ")}.`);
  return pass(ruleId);
}
