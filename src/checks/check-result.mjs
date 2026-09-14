export function pass(ruleId, message = "") {
  return { ruleId, status: "pass", message };
}

export function fail(ruleId, message) {
  return { ruleId, status: "fail", message };
}

export function assertCheckResult(result, expectedRuleId) {
  if (!result || !["pass", "fail"].includes(result.status) || result.ruleId !== expectedRuleId) {
    throw new Error(`Check ${expectedRuleId} returned an invalid result.`);
  }
  return result;
}
