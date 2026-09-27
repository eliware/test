export function validateAuthorityRegistryShape(entries) {
  if (!Array.isArray(entries)) return "authority-map.json must declare repositoryRegistry.";
  const repositories = entries
    .filter((entry) => entry && typeof entry.repository === "string")
    .map((entry) => entry.repository);
  const uniqueRepositories = new Set(repositories);
  if (uniqueRepositories.size !== repositories.length) {
    const duplicate = repositories.find((repository, index) => repositories.indexOf(repository) !== index);
    return `Duplicate authority repository: ${duplicate}.`;
  }
  return null;
}

export function validateAuthorityRegistryEntryShape(entry, index) {
  if (!entry || typeof entry !== "object" || typeof entry.repository !== "string") {
    return `repositoryRegistry[${index}] must declare a repository.`;
  }
  return null;
}
