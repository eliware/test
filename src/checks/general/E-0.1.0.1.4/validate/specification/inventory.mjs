import { listSpecificationEntries } from "../../list-specification-entries.mjs";
import { groupSpecificationEntries } from "../../group-specification-entries.mjs";

export async function loadSpecificationIndexInventory(root, list) {
  const entries = await listSpecificationEntries(root, { list });
  const directories = [
    "specs",
    ...entries.filter((entry) => entry.type === "directory").map((entry) => entry.path),
  ];
  return { entries, directories, ...groupSpecificationEntries(entries) };
}
