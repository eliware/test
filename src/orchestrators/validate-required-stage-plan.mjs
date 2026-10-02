const stageRules = Object.freeze({
  executeJest: ["E-0.1.130.13", "E-0.1.40.15"],
  executeLint: ["E-0.1.4"],
  executeAudit: ["E-0.1.20.19"],
  executePack: ["E-0.1.140.1"],
  executeFormat: ["E-0.1.20.17"],
});

export function validateRequiredStagePlan(checks, context, exemptions = new Set()) {
  if (context.focusedScope) return;
  const ids = new Set(checks.map(({ ruleId }) => ruleId));
  const checksById = new Map(checks.map((check) => [check.ruleId, check]));
  const missing = [];
  for (const [flag, rules] of Object.entries(stageRules)) {
    if (!context[flag]) continue;
    if (flag === "executePack" && !context.packageJson?.eliware?.apply?.includes("npm-published"))
      continue;
    const owners = rules.filter((ruleId) => ids.has(ruleId) && !isExempt(ruleId));
    if (owners.length === 0) missing.push(`${flag} (${rules.join(", ")})`);
  }
  if (missing.length > 0)
    throw new Error(`Aggregate validation stage checks are missing: ${missing.join("; ")}.`);

  function isExempt(ruleId) {
    let current = checksById.get(ruleId);
    while (current) {
      if (exemptions.has(current.ruleId) || exemptions.has(current.parentRuleId)) return true;
      current = checksById.get(current.parentRuleId);
    }
    return exemptions.has(ruleId);
  }
}
