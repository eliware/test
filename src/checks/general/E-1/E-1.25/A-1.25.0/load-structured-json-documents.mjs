import { readFile } from "node:fs/promises";
import { collectJsonFiles } from "./collect-json-files.mjs";

export async function loadStructuredJsonDocuments(root) {
  const files = await collectJsonFiles(root);
  const documents = new Map();
  for (const file of files) {
    try {
      documents.set(file, JSON.parse(await readFile(file, "utf8")));
    } catch (error) {
      return { error: `Structured JSON document ${file} is invalid: ${error.message}` };
    }
  }
  return { documents };
}
