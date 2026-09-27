import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { collectStructuredReferences } from "./collect-structured-references.mjs";
import { resolveStructuredReference } from "./resolve-structured-reference.mjs";
import { readRegisteredRepositoryRootsResult } from "./read-registered-repository-roots.mjs";
import { validateLocalStructuredReference } from "./validate-local-structured-reference.mjs";
import { validateRegisteredStructuredReference } from "./validate-registered-structured-reference.mjs";

export async function validateStructuredReferences(root, files, inventory) {
  let registeredRepositoryRoots;
  let registeredRepositoryError;
  let registryLoaded = false;
  for (const relativeFile of files) {
    const file = join(root, relativeFile);
    const document = inventory
      ? await inventory.readParsed(file, "json", JSON.parse)
      : JSON.parse(await readFile(file, "utf8"));
    const references = collectStructuredReferences(document);
    for (const reference of references) {
      const resolved = resolveStructuredReference(
        root,
        file,
        reference.path,
        reference.crossRepository,
      );
      if (!resolved) continue;
      if (resolved.external) {
        if (!registryLoaded) {
          const registry = await readRegisteredRepositoryRootsResult(root, inventory);
          registeredRepositoryRoots = registry.roots;
          registeredRepositoryError = registry.error;
          registryLoaded = true;
        }
        await validateRegisteredStructuredReference({
          reference: reference.path,
          target: resolved.target,
          registeredRepositoryRoots,
          registryError: registeredRepositoryError,
        });
        continue;
      }
      await validateLocalStructuredReference(resolved.target);
    }
  }
  return null;
}
