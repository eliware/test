import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { collectStructuredReferences } from "./collect-structured-references.mjs";
import { resolveStructuredReference } from "./resolve-structured-reference.mjs";
import { validateLocalStructuredReference } from "./validate-local-structured-reference.mjs";

export async function validateStructuredReferences(root, files, inventory) {
  const failures = [];
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
      const resolved = resolveStructuredReference(root, file, reference);
      if (!resolved) continue;
      try {
        await validateLocalStructuredReference(resolved.target);
      } catch (error) {
        failures.push(`${relativeFile}: ${reference}: ${error.message}`);
      }
    }
  }
  return failures.length ? failures.join("\n") : null;
}
