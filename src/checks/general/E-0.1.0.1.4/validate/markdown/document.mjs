import { join } from "node:path";
import { readFile } from "node:fs/promises";
import { validateMarkdownReferences } from "./references.mjs";

export async function validateMarkdownDocument(root, file, validateLocal, read = readFile) {
  let text;
  try {
    text = await read(join(root, file), "utf8");
  } catch (error) {
    return [`${file} could not be read: ${error.message}`];
  }
  return validateMarkdownReferences(file, text, validateLocal);
}
