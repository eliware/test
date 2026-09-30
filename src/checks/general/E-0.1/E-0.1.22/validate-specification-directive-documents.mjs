import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { validateDirectiveTree } from "./validate-directive-tree.mjs";
import { validateDirectiveRecords } from "./validate-directive-records.mjs";

async function collectJsonFiles(directory, root = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectJsonFiles(path, root)));
    else if (entry.isFile() && entry.name.endsWith(".json"))
      files.push(path.slice(root.length + 1));
  }
  return files;
}

function validateDocument(document, name) {
  if (!document || typeof document !== "object" || Array.isArray(document)) return [];
  if (!Object.hasOwn(document, "directives")) return [];
  const errors = [];
  if (Object.keys(document).some((key) => !["version", "description", "directives"].includes(key)))
    errors.push(`${name} contains unsupported directive-document fields.`);
  if (typeof document.version !== "string" || !document.version.trim())
    errors.push(`${name}.version must be a non-empty string.`);
  if (typeof document.description !== "string" || !document.description.trim())
    errors.push(`${name}.description must be a non-empty string.`);
  errors.push(...validateDirectiveRecords(document.directives, `${name}.directives`));
  if (Array.isArray(document.directives))
    errors.push(...validateDirectiveTree(document.directives));
  return errors;
}

export async function validateSpecificationDirectiveDocuments(root, inventory = null) {
  const directory = join(root, "specs");
  const files = inventory
    ? await inventory.documentationFiles({ directory, predicate: (name) => name.endsWith(".json") })
    : await collectJsonFiles(directory);
  const errors = [];
  for (const relativeFile of files) {
    try {
      const path = join(directory, relativeFile);
      const document = inventory
        ? await inventory.readParsed(path, "json", JSON.parse)
        : JSON.parse(await readFile(path, "utf8"));
      errors.push(...validateDocument(document, relativeFile));
    } catch (error) {
      errors.push(`${relativeFile} could not be read as JSON: ${error.message}`);
    }
  }
  return errors;
}
