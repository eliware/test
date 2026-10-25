import { readdir, readFile } from "node:fs/promises";
import { readCanonicalOrder } from "../../../../../validation/shared/conventions/read-canonical-order.mjs";
import { validateSpecificationIndex } from "./index/directory.mjs";
import { validateSpecificationTreeRequirements } from "./tree-requirements.mjs";
import { loadSpecificationIndexInventory } from "./inventory.mjs";

export async function validateSpecificationIndexes(root, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  const list = dependencies.readdir ?? readdir;
  let inventory;
  try {
    inventory = await loadSpecificationIndexInventory(root, list);
  } catch (error) {
    if (error.code === "ENOENT")
      return ["specs/ is required to contain indexed YAML specifications."];
    return [`Specification discovery failed: ${error.message}`];
  }
  const indexOrder = (dependencies.readOrder ?? readCanonicalOrder)("specification-indexes.yaml");
  const errors = validateSpecificationTreeRequirements(inventory.entries);
  for (const directory of inventory.directories)
    errors.push(
      ...(await validateSpecificationIndex(root, directory, {
        files: inventory.filesByDirectory.get(directory) ?? [],
        children: inventory.childrenByDirectory.get(directory) ?? [],
        order: indexOrder,
        read,
      })),
    );
  return errors;
}
