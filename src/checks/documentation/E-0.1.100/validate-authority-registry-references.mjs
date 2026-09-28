import { dirname, isAbsolute, relative, resolve, sep } from "node:path";
import { validateAuthorityReference } from "./validate-authority-reference.mjs";

function isWithin(directory, target) {
  const pathFromDirectory = relative(directory, target);
  return (
    pathFromDirectory === "" ||
    (pathFromDirectory !== ".." &&
      !pathFromDirectory.startsWith(`..${sep}`) &&
      !isAbsolute(pathFromDirectory))
  );
}

export async function validateAuthorityRegistryReferences({ root, file, entry }) {
  if (typeof entry.path !== "string" || !entry.path.trim())
    return `${entry.repository} must declare path.`;
  const failures = [];
  const repositoryRoot = resolve(dirname(file), entry.path);
  const repositoryError = await validateAuthorityReference({
    root,
    file,
    reference: entry.path,
    label: `${entry.repository}.path`,
    registeredRepositoryRoots: [repositoryRoot],
  });
  if (repositoryError) failures.push(repositoryError);
  const repositoryAnchor = resolve(repositoryRoot, "authority-registry-reference.json");
  for (const field of ["package", "authorityFile", "reference"]) {
    if (typeof entry[field] !== "string") {
      failures.push(`${entry.repository} must declare ${field}.`);
      continue;
    }
    const target = resolve(repositoryRoot, entry[field]);
    if (!isWithin(repositoryRoot, target)) {
      failures.push(`${entry.repository}.${field} must resolve within its repository path.`);
      continue;
    }
    const error = await validateAuthorityReference({
      root,
      file: repositoryAnchor,
      reference: entry[field],
      label: `${entry.repository}.${field}`,
      registeredRepositoryRoots: [repositoryRoot],
    });
    if (error) failures.push(error);
  }
  return failures.length ? failures.join("\n") : null;
}
