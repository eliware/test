function assertCheckResult(result, expectedRuleId) {
  if (
    !result ||
    typeof result !== "object" ||
    Array.isArray(result) ||
    !["pass", "fail"].includes(result.status) ||
    result.ruleId !== expectedRuleId ||
    typeof result.message !== "string"
  ) {
    throw new Error(`Check ${expectedRuleId} returned an invalid result.`);
  }
  return result;
}
export default assertCheckResult;
