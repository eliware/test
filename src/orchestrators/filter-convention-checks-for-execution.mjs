export function filterConventionChecksForExecution(checks, context, exemptions) {
  const byRuleId = new Map(checks.map((check) => [check.ruleId, check]));
  if (context.modeRuleId && !byRuleId.has(context.modeRuleId)) {
    throw new Error(`Validation mode ${context.modeRuleId} is unavailable in the selected checks.`);
  }
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
