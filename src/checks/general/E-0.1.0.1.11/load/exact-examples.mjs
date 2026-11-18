import { readFile, readdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { parseAllDocuments } from "yaml";
import findYamlExampleFiles from "./example-files.mjs";
import collectExactExamples from "./collect-exact-examples.mjs";
const conventionsPath = fileURLToPath(new URL("../../../../../specs/conventions", import.meta.url));
export default async function loadExactExamples(options, defaults) {
  const settings = options ?? {};
  const fallback = defaults ?? {
    list: readdir,
    read: readFile,
    root: conventionsPath,
  };
  const directory = settings.root ?? fallback.root;
  const list = settings.list ?? fallback.list;
  const read = settings.read ?? fallback.read;
  const files = await findYamlExampleFiles(directory, list);
  const exact = new Set();
  for (const path of files) {
    let documents;
    try {
      documents = parseAllDocuments(await read(path, "utf8"));
    } catch {
      continue;
    }
    for (const document of documents) {
      if (document.errors.length) continue;
      collectExactExamples(document.contents, exact);
    }
  }
  return exact;
}
