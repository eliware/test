import { validateAuthorityMapPaths } from "./validate-authority-map-paths.mjs";
import { validateAuthorityReciprocity } from "./validate-authority-reciprocity.mjs";
import { validateAuthorityRegistry } from "./validate-authority-registry.mjs";

export async function validateAuthorityMap({ root, file, document }) {
  if (!document || typeof document !== "object") return "authority-map.json must declare repositoryRegistry.";
  const registryError = await validateAuthorityRegistry({ root, file, entries: document.repositoryRegistry });
  if (registryError) return registryError;
  const reciprocityError = await validateAuthorityReciprocity({ root, file, entries: document.repositoryRegistry });
  if (reciprocityError) return reciprocityError;
  return validateAuthorityMapPaths({
    root,
    file,
    crosslinks: document.crosslinks,
    structuredDocuments: document.structuredDocuments,
  });
}
