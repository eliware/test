export function filterConventionChecksForExecution(checks, context, exemptions) {
  const byRuleId = new Map(checks.map((check) => [check.ruleId, check]));
  const isExempt = (ruleId) => {
    let current = byRuleId.get(ruleId);
    while (current) {
      if (exemptions.has(current.ruleId)) return true;
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
