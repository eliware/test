import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { collectStructuredReferences } from "./collect-structured-references.mjs";
import { resolveStructuredReference } from "./resolve-structured-reference.mjs";
import { readRegisteredRepositoryRootsResult } from "./read-registered-repository-roots.mjs";
import { validateLocalStructuredReference } from "./validate-local-structured-reference.mjs";
import { validateRegisteredStructuredReference } from "./validate-registered-structured-reference.mjs";

export async function validateStructuredReferences(root, files, inventory) {
  const failures = [];
  let registeredRepositoryRoots;
  let registeredRepositoryError;
  let registryLoaded = false;
  for (const relativeFile of files) {
    const file = join(root, relativeFile);
    let document;
    try {
      document = inventory
        ? await inventory.readParsed(file, "json", JSON.parse)
        : JSON.parse(await readFile(file, "utf8"));
    } catch (error) {
      failures.push(`${relativeFile}: ${error.message}`);
      continue;
    }
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
        try {
          await validateRegisteredStructuredReference({
            reference: reference.path,
            target: resolved.target,
            registeredRepositoryRoots,
            registryError: registeredRepositoryError,
          });
        } catch (error) {
          failures.push(`${relativeFile}: ${error.message}`);
        }
        continue;
      }
      try {
        await validateLocalStructuredReference(resolved.target);
      } catch (error) {
        failures.push(`${relativeFile}: ${reference.path}: ${error.message}`);
      }
    }
  }
  return failures.length ? failures.join("\n") : null;
}
