import { validateAuthorityReference } from "./validate-authority-reference.mjs";

export async function validateAuthorityMapPaths({ root, file, crosslinks = [], structuredDocuments = [] }) {
  for (const [index, link] of crosslinks.entries()) {
    if (!link || typeof link.path !== "string") {
      return `authority-map crosslinks[${index}] must contain a path.`;
    }
    const error = await validateAuthorityReference({
      root,
      file,
      reference: link.path,
      label: `authority-map crosslinks[${index}]`,
    });
    if (error) return error;
  }
  for (const [index, record] of structuredDocuments.entries()) {
    if (!record || typeof record.path !== "string") {
      return `authority-map structuredDocuments[${index}] must contain a path.`;
    }
    const error = await validateAuthorityReference({
      root,
      file,
      reference: record.path,
      label: `authority-map structuredDocuments[${index}]`,
    });
    if (error) return error;
  }
  return null;
}
