import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseAllDocuments } from "yaml";

function collectDeclaredHeadings(directives, headings) {
  if (!Array.isArray(directives)) return;
  for (const directive of directives) {
    for (const text of directive?.dos ?? []) {
      if (typeof text !== "string") continue;
      for (const match of text.matchAll(/^## ([^\r\n]+)$/gmu)) headings.add(match[1].trim());
    }
    collectDeclaredHeadings(directive?.children, headings);
  }
}

async function collectYamlFiles(directory, files) {
  let entries;
  try {
    entries = await readdir(directory, { withFileTypes: true });
  } catch (error) {
    if (error.code === "ENOENT") return;
    throw error;
  }
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await collectYamlFiles(path, files);
    else if (entry.isFile() && /\.ya?ml$/iu.test(entry.name)) files.push(path);
  }
}

export async function readSpecificationHeadings(root, { read = readFile } = {}) {
  const files = [];
  await collectYamlFiles(join(root, "specs"), files);
  const headings = new Set();
  for (const file of files) {
    const documents = parseAllDocuments(await read(file, "utf8"));
    const error = documents.flatMap((document) => document.errors)[0];
    if (error) throw error;
    for (const document of documents)
      collectDeclaredHeadings(document.toJSON()?.directives, headings);
  }
  return headings;
}
