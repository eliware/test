import { findLineLimitViolations } from "./find-line-limit-violations.mjs";
import { fail, pass } from "../../../check-result.mjs";

export async function runLineLimits({ root, ruleId, repositoryInventory, requireTests = false }) {
  let sourceViolations;
  try {
    sourceViolations = await findLineLimitViolations(root, "src", 100, repositoryInventory);
  } catch (error) {
    if (error.code === "ENOENT") return fail(ruleId, "src/ is required for line-count validation.");
    return fail(ruleId, `Could not validate src/ line-count limits: ${error.message}`);
  }
  let testViolations = [];
  if (requireTests) {
    try {
      testViolations = await findLineLimitViolations(root, "tests", 200, repositoryInventory);
    } catch (error) {
      if (error.code === "ENOENT")
        return fail(ruleId, "tests/ is required for line-count validation.");
      return fail(ruleId, `Could not validate tests/ line-count limits: ${error.message}`);
    }
  }
  const violations = [...sourceViolations, ...testViolations];
  if (violations.length > 0)
    return fail(ruleId, `Line-count limits exceeded: ${violations.join(", ")}.`);
  return pass(ruleId);
}
