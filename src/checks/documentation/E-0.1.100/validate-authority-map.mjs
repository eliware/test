import { validateAuthorityMapPaths } from "./validate-authority-map-paths.mjs";
import { validateAuthorityReciprocity } from "./validate-authority-reciprocity.mjs";
import { validateAuthorityRegistry } from "./validate-authority-registry.mjs";

export async function validateAuthorityMap({ root, file, document, inventory }) {
  if (!document || typeof document !== "object")
    return "authority-map.json must declare repositoryRegistry.";
  const failures = [];
  const registryError = await validateAuthorityRegistry({
    root,
    file,
    entries: document.repositoryRegistry,
  });
  if (registryError) failures.push(registryError);
  if (Array.isArray(document.repositoryRegistry)) {
    const reciprocityError = await validateAuthorityReciprocity({
      root,
      file,
      entries: document.repositoryRegistry,
      inventory,
    });
    if (reciprocityError) failures.push(reciprocityError);
  }
  const pathsError = await validateAuthorityMapPaths({
    root,
    file,
    repositoryRegistry: document.repositoryRegistry,
    crosslinks: document.crosslinks,
    structuredDocuments: document.structuredDocuments,
    inventory,
  });
  if (pathsError) failures.push(pathsError);
  return failures.length ? failures.join("\n") : null;
}
