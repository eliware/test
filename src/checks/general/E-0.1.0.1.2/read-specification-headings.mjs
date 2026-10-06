import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";

function collectHeadings(value, headings) {
  if (typeof value === "string") {
    for (const match of value.matchAll(/^## ([^\r\n]+)$/gmu)) headings.add(match[1].trim());
  } else if (Array.isArray(value)) {
    value.forEach((item) => collectHeadings(item, headings));
  } else if (value && typeof value === "object") {
    Object.values(value).forEach((item) => collectHeadings(item, headings));
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
  for (const file of files) collectHeadings(parse(await read(file, "utf8")), headings);
  return headings;
}
