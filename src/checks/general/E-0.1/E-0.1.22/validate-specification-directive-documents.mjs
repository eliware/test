import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { validateDirectiveTree } from "./validate-directive-tree.mjs";
import { validateDirectiveRecords } from "./validate-directive-records.mjs";

async function collectYamlFiles(directory, root = directory) {
  const files = [];
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await collectYamlFiles(path, root)));
    else if (entry.isFile() && entry.name.endsWith(".yaml"))
      files.push(path.slice(root.length + 1));
  }
  return files;
}

function validateDocument(document, name) {
  if (!document || typeof document !== "object" || Array.isArray(document)) return [];
  if (!Object.hasOwn(document, "directives")) return [];
  const errors = [];
  if (
    Object.keys(document).some(
      (key) => !["version", "description", "requires", "directives"].includes(key),
    )
  )
    errors.push(`${name} contains unsupported directive-document fields.`);
  if (typeof document.version !== "string" || !document.version.trim())
    errors.push(`${name}.version must be a non-empty string.`);
  if (typeof document.description !== "string" || !document.description.trim())
    errors.push(`${name}.description must be a non-empty string.`);
  if (
    document.requires !== undefined &&
    (!Array.isArray(document.requires) ||
      document.requires.some(
        (profile) => typeof profile !== "string" || !/^[a-z0-9-]+$/u.test(profile),
      ))
  )
    errors.push(`${name}.requires must be an array of profile names.`);
  errors.push(...validateDirectiveRecords(document.directives, `${name}.directives`));
  if (Array.isArray(document.directives))
    errors.push(...validateDirectiveTree(document.directives));
  return errors;
}

export async function validateSpecificationDirectiveDocuments(root, inventory = null) {
  const directory = join(root, "specs");
  const files = inventory
    ? await inventory.documentationFiles({ directory, predicate: (name) => name.endsWith(".yaml") })
    : await collectYamlFiles(directory);
  const errors = [];
  for (const relativeFile of files) {
    try {
      const path = join(directory, relativeFile);
      const document = inventory
        ? await inventory.readParsed(path, "yaml-document", parse)
        : parse(await readFile(path, "utf8"));
      errors.push(...validateDocument(document, relativeFile));
    } catch (error) {
      errors.push(`${relativeFile} could not be read as YAML: ${error.message}`);
    }
  }
  return errors;
}
