import { assertCheckResult } from "../checks/check-result.mjs";

export async function executeConventionChecks(checks, context, exemptions) {
  const results = [];
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
  for (const check of checks) {
    if (isExempt(check.ruleId)) continue;
    // codescope ignore: non-deterministic checks are intentionally advisory and are not enforcement results.
    if (check.enforcementMode === "non-deterministic") continue;
    if (context.modeRuleId && check.ruleId !== context.modeRuleId) continue;
    if (typeof check.run !== "function") throw new Error(`Selected check ${check.ruleId} is incomplete and cannot be executed.`);
    context.timing?.start?.(check.ruleId);
    const result = await check.run(context);
    results.push(assertCheckResult(result, check.ruleId));
    context.timing?.end?.(check.ruleId);
  }
  return results;
}
