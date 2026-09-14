import { readFile } from "node:fs/promises";
import { collectJsonFiles } from "./collect-json-files.mjs";

export async function loadStructuredJsonDocuments(root) {
  let files;
  try {
    files = await collectJsonFiles(root);
  } catch (error) {
    return { error: error.message };
  }
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
