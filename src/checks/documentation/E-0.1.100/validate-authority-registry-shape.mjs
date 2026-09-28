export function validateAuthorityRegistryShape(entries) {
  if (!Array.isArray(entries)) return "authority-map.json must declare repositoryRegistry.";
  const repositories = entries
    .filter((entry) => entry && typeof entry.repository === "string")
    .map((entry) => entry.repository);
  const uniqueRepositories = new Set(repositories);
  const duplicates = [...uniqueRepositories].filter(
    (repository) => repositories.indexOf(repository) !== repositories.lastIndexOf(repository),
  );
  if (duplicates.length)
    return duplicates
      .map((repository) => `Duplicate authority repository: ${repository}.`)
      .join("\n");
  return null;
}

export function validateAuthorityRegistryEntryShape(entry, index) {
  if (!entry || typeof entry !== "object" || typeof entry.repository !== "string") {
    return `repositoryRegistry[${index}] must declare a repository.`;
  }
  return null;
}
