export function filterConventionChecksForExecution(checks, context, exemptions) {
  const byRuleId = new Map(checks.map((check) => [check.ruleId, check]));
  const isFullyExempt = (ruleId) =>
    exemptions instanceof Set ? exemptions.has(ruleId) : exemptions.get(ruleId) === null;
  const isExempt = (ruleId) => {
    let current = byRuleId.get(ruleId);
    while (current) {
      if (isFullyExempt(current.ruleId)) return true;
      current = byRuleId.get(current.parentRuleId);
    }
    return false;
  };
  return checks.filter(
    (check) =>
      check.applicability !== "advisory-only" &&
      !isExempt(check.ruleId) &&
      (!context.modeRuleId || check.ruleId === context.modeRuleId),
  );
}
