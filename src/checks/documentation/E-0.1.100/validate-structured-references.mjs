import { readFile, stat } from "node:fs/promises";
import { join } from "node:path";
import { collectStructuredReferences } from "./collect-structured-references.mjs";
import { isWithinRegisteredRepository, resolveStructuredReference } from "./resolve-structured-reference.mjs";
import { readRegisteredRepositoryRoots } from "./read-registered-repository-roots.mjs";

export async function validateStructuredReferences(root, files, inventory) {
  let registeredRepositoryRoots;
  let registryLoaded = false;
  for (const relativeFile of files) {
    const file = join(root, relativeFile);
    const document = inventory
      ? await inventory.readParsed(file, "json", JSON.parse)
      : JSON.parse(await readFile(file, "utf8"));
    const references = collectStructuredReferences(document);
    for (const reference of references) {
      const resolved = resolveStructuredReference(root, file, reference.path, reference.crossRepository);
      if (!resolved) continue;
      if (resolved.external) {
        if (!registryLoaded) {
          registeredRepositoryRoots = await readRegisteredRepositoryRoots(root, inventory);
          registryLoaded = true;
        }
        if (
          registeredRepositoryRoots &&
          !registeredRepositoryRoots.some((repositoryRoot) =>
            isWithinRegisteredRepository(resolved.target, repositoryRoot),
          )
        ) {
          throw new Error(`${reference.path} is outside every registered repository path`);
        }
      }
      try {
        await stat(resolved.target);
      } catch (error) {
        if (resolved.external && error.code === "ENOENT") continue;
        throw error;
      }
      if (resolved.external && registeredRepositoryRoots === null) {
        throw new Error(
          `${reference.path} cannot be verified without the registered repository map`,
        );
      }
    }
  }
  return null;
}
