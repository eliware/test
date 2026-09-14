import { resolve } from "node:path";
import { validateAuthorityReference } from "./validate-authority-reference.mjs";

const namespacePattern = /^[EA]-\d+(?:\.\d+)*$/;

export async function validateAuthorityRegistry({ root, file, entries }) {
  if (!Array.isArray(entries)) return "authority-map.json must declare repositoryRegistry.";
  const repositories = new Set(entries.filter((entry) => entry && typeof entry.repository === "string").map((entry) => entry.repository));
  if (repositories.size !== entries.filter((entry) => entry && typeof entry.repository === "string").length) {
    return `Duplicate authority repository: ${entries.find((entry, index) => entry && typeof entry.repository === "string" && entries.findIndex((candidate) => candidate?.repository === entry.repository) !== index)?.repository ?? "unknown"}.`;
  }
  const seenRepositories = new Set();
  const governedTargets = new Set();
  for (const [index, entry] of entries.entries()) {
    if (!entry || typeof entry !== "object" || typeof entry.repository !== "string") {
      return `repositoryRegistry[${index}] must declare a repository.`;
    }
    if (seenRepositories.has(entry.repository)) return `Duplicate authority repository: ${entry.repository}.`;
    seenRepositories.add(entry.repository);
    if (typeof entry.path !== "string" || !entry.path.trim()) return `${entry.repository} must declare path.`;
    const repositoryRoot = resolve(file, "..", entry.path);
    const fields = {};
    for (const field of ["path", "package", "authorityFile", "reference"]) {
      if (typeof entry[field] !== "string") return `${entry.repository} must declare ${field}.`;
      const error = await validateAuthorityReference({
        root,
        file,
        reference: entry[field],
        label: `${entry.repository}.${field}`,
      });
      if (error) return error;
      fields[field] = resolve(file, "..", entry[field]);
    }
    for (const field of ["package", "authorityFile", "reference"]) {
      const target = fields[field];
      if (target !== repositoryRoot && !target.startsWith(`${repositoryRoot}/`) && !target.startsWith(`${repositoryRoot}\\`)) {
        return `${entry.repository}.${field} must resolve within its repository path.`;
      }
    }
    if (!Array.isArray(entry.governs) || entry.governs.length === 0 || entry.governs.some((target) => typeof target !== "string" || !target.trim())) {
      return `${entry.repository} must declare valid governs targets.`;
    }
    for (const target of entry.governs) {
      if (governedTargets.has(target)) return `Duplicate normative authority target: ${target}.`;
      governedTargets.add(target);
    }
    for (const field of ["baselineFor"]) {
      if (entry[field] !== undefined && (!Array.isArray(entry[field]) || entry[field].some((repository) => !repositories.has(repository)))) {
        return `${entry.repository}.${field} contains unsupported delegation.`;
      }
    }
    if (entry.inheritsSharedBaselineFrom !== undefined && !repositories.has(entry.inheritsSharedBaselineFrom)) {
      return `${entry.repository}.inheritsSharedBaselineFrom contains unsupported delegation.`;
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
