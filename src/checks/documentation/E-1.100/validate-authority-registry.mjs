import { validateAuthorityReference } from "./validate-authority-reference.mjs";

const namespacePattern = /^[EA]-\d+(?:\.\d+)*$/;

export async function validateAuthorityRegistry({ root, file, entries }) {
  if (!Array.isArray(entries)) return "authority-map.json must declare repositoryRegistry.";
  const repositories = new Set();
  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== "object" || typeof entry.repository !== "string") {
      return `repositoryRegistry[${index}] must declare a repository.`;
    }
    if (repositories.has(entry.repository)) return `Duplicate authority repository: ${entry.repository}.`;
    repositories.add(entry.repository);
    for (const field of ["path", "package", "authorityFile", "reference"]) {
      if (typeof entry[field] !== "string") return `${entry.repository} must declare ${field}.`;
      const error = await validateAuthorityReference({
        root,
        file,
        reference: entry[field],
        label: `${entry.repository}.${field}`,
      });
      if (error) return error;
    }
    if (
      !Array.isArray(entry.directiveNamespaces) ||
      entry.directiveNamespaces.some((namespace) => !namespacePattern.test(namespace))
    ) {
      return `${entry.repository} must declare valid directiveNamespaces.`;
    }
  }
  return null;
}
