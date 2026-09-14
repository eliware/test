export function validateExemptionIds(packageJson, checks, ignoredRuleIds = []) {
  const knownIds = new Set(checks.map(({ ruleId }) => ruleId));
  const requested = [
    ...(packageJson?.eliware?.exempt ?? []).map(({ ruleId }) => ruleId),
    ...ignoredRuleIds,
  ];
  const unknown = requested.filter((ruleId) => !knownIds.has(ruleId));
  if (unknown.length > 0) {
    throw new Error(`Unknown convention exemption rule ID: ${unknown.join(", ")}.`);
  }
}
