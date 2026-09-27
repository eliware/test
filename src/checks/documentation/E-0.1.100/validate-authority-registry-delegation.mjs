export function validateAuthorityRegistryDelegation(entry, repositories) {
  if (
    entry.baselineFor !== undefined &&
    (!Array.isArray(entry.baselineFor) ||
      entry.baselineFor.some((repository) => !repositories.has(repository)))
  ) {
    return `${entry.repository}.baselineFor contains unsupported delegation.`;
  }
  if (
    entry.inheritsSharedBaselineFrom !== undefined &&
    !repositories.has(entry.inheritsSharedBaselineFrom)
  ) {
    return `${entry.repository}.inheritsSharedBaselineFrom contains unsupported delegation.`;
  }
  return null;
}
