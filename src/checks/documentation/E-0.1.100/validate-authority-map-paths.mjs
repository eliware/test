import { dirname, resolve } from "node:path";
import { validateAuthorityReference } from "./validate-authority-reference.mjs";

export async function validateAuthorityMapPaths({
  root,
  file,
  repositoryRegistry = [],
  crosslinks = [],
  structuredDocuments = [],
}) {
  const failures = [];
  if (!Array.isArray(repositoryRegistry))
    failures.push("authority-map repositoryRegistry must be an array.");
  if (!Array.isArray(crosslinks)) failures.push("authority-map crosslinks must be an array.");
  if (!Array.isArray(structuredDocuments))
    failures.push("authority-map structuredDocuments must be an array.");
  const registeredRepositoryRoots = (Array.isArray(repositoryRegistry) ? repositoryRegistry : [])
    .filter((entry) => entry && typeof entry === "object")
    .filter((entry) => typeof entry?.path === "string")
    .map((entry) => resolve(dirname(file), entry.path));
  for (const [index, link] of (Array.isArray(crosslinks) ? crosslinks : []).entries()) {
    if (!link || typeof link.path !== "string") {
      failures.push(`authority-map crosslinks[${index}] must contain a path.`);
      continue;
    }
    const error = await validateAuthorityReference({
      root,
      file,
      reference: link.path,
      label: `authority-map crosslinks[${index}]`,
      registeredRepositoryRoots,
    });
    if (error) failures.push(error);
  }
  for (const [index, record] of (Array.isArray(structuredDocuments)
    ? structuredDocuments
    : []
  ).entries()) {
    if (!record || typeof record.path !== "string") {
      failures.push(`authority-map structuredDocuments[${index}] must contain a path.`);
      continue;
    }
    const error = await validateAuthorityReference({
      root,
      file,
      reference: record.path,
      label: `authority-map structuredDocuments[${index}]`,
      registeredRepositoryRoots,
    });
    if (error) failures.push(error);
  }
  return failures.length ? failures.join("\n") : null;
}
