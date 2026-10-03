export function validateLockfilePeerDependenciesMeta(path, entry) {
  const metadata = entry.peerDependenciesMeta;
  if (metadata === undefined) return [];
  if (!metadata || typeof metadata !== "object" || Array.isArray(metadata))
    return [`package-lock.json entry ${path} has invalid peerDependenciesMeta.`];

  const failures = [];
  for (const [dependency, configuration] of Object.entries(metadata)) {
    if (
      !configuration ||
      typeof configuration !== "object" ||
      Array.isArray(configuration) ||
      (configuration.optional !== undefined && typeof configuration.optional !== "boolean")
    )
      failures.push(
        `package-lock.json entry ${path} has invalid peerDependenciesMeta entry ${dependency}.`,
      );
  }
  return failures;
}
