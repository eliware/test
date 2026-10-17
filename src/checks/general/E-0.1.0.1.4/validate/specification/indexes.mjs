import { readdir, readFile } from "node:fs/promises";
import { listSpecificationEntries } from "../../list-specification-entries.mjs";
import { groupSpecificationEntries } from "../../group-specification-entries.mjs";
import { readCanonicalOrder } from "../../../../../validation/shared/conventions/read-canonical-order.mjs";
import { validateSpecificationIndex } from "./index/directory.mjs";
import { validateSpecificationTreeRequirements } from "./tree-requirements.mjs";

export async function validateSpecificationIndexes(root, dependencies = {}) {
  const read = dependencies.read ?? readFile;
  const list = dependencies.readdir ?? readdir;
  let entries;
  try {
    entries = await listSpecificationEntries(root, { list });
  } catch (error) {
    if (error.code === "ENOENT")
      return ["specs/ is required to contain indexed YAML specifications."];
    return [`Specification discovery failed: ${error.message}`];
  }
  const directories = [
    "specs",
    ...entries.filter((entry) => entry.type === "directory").map((entry) => entry.path),
  ];
  const { filesByDirectory, childrenByDirectory } = groupSpecificationEntries(entries);
  const indexOrder = (dependencies.readOrder ?? readCanonicalOrder)("specification-indexes.yaml");
  const errors = validateSpecificationTreeRequirements(entries);
  for (const directory of directories)
    errors.push(
      ...(await validateSpecificationIndex(root, directory, {
        files: filesByDirectory.get(directory) ?? [],
        children: childrenByDirectory.get(directory) ?? [],
        order: indexOrder,
        read,
      })),
    );
  return errors;
}
