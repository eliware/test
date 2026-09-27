export function validateAuthorityRegistryGovernance(entry, governedTargets) {
  if (
    !Array.isArray(entry.governs) ||
    entry.governs.length === 0 ||
    entry.governs.some((target) => typeof target !== "string" || !target.trim())
  ) {
    return `${entry.repository} must declare valid governs targets.`;
  }
  for (const target of entry.governs) {
    if (governedTargets.has(target)) return `Duplicate normative authority target: ${target}.`;
    governedTargets.add(target);
  }
  return null;
}
