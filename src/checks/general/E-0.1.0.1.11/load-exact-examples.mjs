import { readFile, readdir } from "node:fs/promises";
import { join } from "node:path";
import { fileURLToPath } from "node:url";
import { isMap, isSeq, isScalar, parseAllDocuments } from "yaml";
import { extractMarkdownProse } from "./extract-markdown-prose.mjs";
import { normalizeSentence, splitSentences } from "./word-tools.mjs";

const conventionsPath = fileURLToPath(new URL("../../../../specs/conventions", import.meta.url));

export async function loadExactExamples(options, defaults) {
  const settings = options ?? {};
  const fallback = defaults ?? { list: readdir, read: readFile, root: conventionsPath };
  const directory = settings.root ?? fallback.root;
  const list = settings.list ?? fallback.list;
  const read = settings.read ?? fallback.read;
  const files = await findYamlFiles(directory, list);
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
      collectExamples(document.contents, exact);
    }
  }
  return exact;
}

async function findYamlFiles(directory, list, files = []) {
  for (const entry of await list(directory, { withFileTypes: true })) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) await findYamlFiles(path, list, files);
    else if (entry.isFile() && /\.ya?ml$/iu.test(entry.name)) files.push(path);
  }
  return files;
}

function collectExamples(node, exact) {
  if (isMap(node)) {
    for (const item of node.items) {
      if (String(item.key.value).toLowerCase() === "examples") collectText(item.value, exact);
      else collectExamples(item.value, exact);
    }
  } else if (isSeq(node)) {
    for (const item of node.items) collectExamples(item, exact);
  }
}

function collectText(node, exact) {
  if (isScalar(node) && typeof node.value === "string") {
    const blocks = extractMarkdownProse(node.value);
    for (const block of blocks)
      for (const sentence of splitSentences(block.text)) exact.add(normalizeSentence(sentence));
    return;
  }
  if (isSeq(node)) for (const item of node.items) collectText(item, exact);
  if (isMap(node)) for (const item of node.items) collectText(item.value, exact);
}
