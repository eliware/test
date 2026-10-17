import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { listSpecificationEntries } from "../../general/E-0.1.0.1.4/list-specification-entries.mjs";
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

export async function readSpecificationHeadings(root, { read = readFile, readdir } = {}) {
  let entries;
  try {
    entries = await listSpecificationEntries(root, { list: readdir });
  } catch (error) {
    if (error.code === "ENOENT") return new Set();
    throw error;
  }
  const headings = new Set();
  for (const { path } of entries.filter(
    ({ path, type }) => type === "file" && /^specs\/.*\.ya?ml$/iu.test(path),
  )) {
    const file = join(root, path);
    for (const document of parseAllDocuments(await read(file, "utf8"))) {
      if (document.errors.length) continue;
      try {
        collectDeclaredHeadings(document.toJSON()?.directives, headings);
      } catch {
        // The specification validator reports parse and alias errors.
      }
    }
  }
  return headings;
}
