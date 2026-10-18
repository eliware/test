import { readFile } from "node:fs/promises";
import { validateMarkdownDocument } from "./document.mjs";

export async function validateMarkdownFiles(root, files, validateLocal, read = readFile) {
  const errors = [];
  for (const file of files)
    errors.push(...(await validateMarkdownDocument(root, file, validateLocal, read)));
  return errors;
}
