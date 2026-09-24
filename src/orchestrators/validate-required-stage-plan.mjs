const stageRules = Object.freeze({
  executeJest: ["E-1.20"],
  executeLint: ["E-1.4"],
  executeAudit: ["E-1.20.19"],
  executePack: ["E-1.140.1"],
  executeFormat: ["E-1.20.17"],
});

export function validateRequiredStagePlan(checks, context, exemptions = new Set()) {
  if ((context.jestArgs ?? []).some((argument) => typeof argument === "string" && !argument.startsWith("--"))) return;
  const ids = new Set(checks.map(({ ruleId }) => ruleId));
  const missing = [];
  for (const [flag, rules] of Object.entries(stageRules)) {
    if (!context[flag] || rules.some((ruleId) => exemptions.has(ruleId))) continue;
    if (flag === "executePack" && !context.packageJson?.eliware?.apply?.includes("npm-published")) continue;
    if (!rules.some((ruleId) => ids.has(ruleId))) missing.push(`${flag} (${rules.join(", ")})`);
  }
  if (missing.length > 0) throw new Error(`Aggregate validation stage checks are missing: ${missing.join("; ")}.`);
}
