import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseBoundedYamlDocuments } from "../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { listSpecificationEntries } from "../../general/E-0.1.0.1.4/list-specification-entries.mjs";

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
    const documents = parseBoundedYamlDocuments(await read(file, "utf8"), path);
    const error = documents.flatMap((document) => document.errors)[0];
    if (error) throw error;
    for (const document of documents)
      collectDeclaredHeadings(document.toJSON()?.directives, headings);
  }
  return headings;
}
