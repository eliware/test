import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

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

function collectIds(directives, ids, errors) {
  for (const directive of directives ?? []) {
    if (!directive || typeof directive !== "object") continue;
    if (typeof directive.id === "string") {
      if (ids.has(directive.id))
        errors.push(`Duplicate specification directive ID: ${directive.id}.`);
      else ids.add(directive.id);
    }
    collectIds(directive.directives, ids, errors);
  }
}

export async function validateUniqueSpecificationDirectiveIds(root, inventory) {
  const directory = join(root, "specs");
  const files = inventory
    ? await inventory.documentationFiles({ directory, predicate: (name) => name.endsWith(".yaml") })
    : await collectYamlFiles(directory);
  const ids = new Set();
  const errors = [];
  for (const relativeFile of files) {
    try {
      const path = join(directory, relativeFile);
      const document = inventory
        ? await inventory.readParsed(path, "yaml-document", parse)
        : parse(await readFile(path, "utf8"));
      collectIds(document.directives, ids, errors);
    } catch (error) {
      errors.push(`${relativeFile} could not be read as YAML: ${error.message}`);
    }
  }
  return errors.length ? errors.join(" ") : null;
}
