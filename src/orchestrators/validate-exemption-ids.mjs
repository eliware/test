export function validateExemptionIds(packageJson, checks) {
  const knownIds = new Set(checks.map(({ ruleId }) => ruleId));
  const unknown = (packageJson?.eliware?.exempt ?? [])
    .map(({ ruleId }) => ruleId)
    .filter((ruleId) => !knownIds.has(ruleId));
  if (unknown.length > 0) {
    throw new Error(`Unknown convention exemption rule ID: ${unknown.join(", ")}.`);
  }
}
