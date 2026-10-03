import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parseSingleYamlDocument } from "../general/E-0.1/parse-single-yaml-document.mjs";
import { normalizeWorkflowDocument } from "./normalize-workflow-document.mjs";

export async function loadWorkflows(root, repositoryInventory) {
  const directory = join(root, ".github", "workflows");
  const entries = repositoryInventory
    ? await repositoryInventory.directoryEntries(directory)
    : await readdir(directory, { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && /\.(?:yml|yaml)$/iu.test(entry.name))
      .map(async (entry) => readWorkflow(directory, entry, repositoryInventory)),
  );
}

async function readWorkflow(directory, entry, repositoryInventory) {
  const file = join(directory, entry.name);
  const content = repositoryInventory
    ? await repositoryInventory.readText(file)
    : await readFile(file, "utf8");
  const document = repositoryInventory
    ? await repositoryInventory.readParsed(file, "yaml-document", parseSingleYamlDocument)
    : parseSingleYamlDocument(content);
  return { name: entry.name, content, document: normalizeWorkflowDocument(document) };
}
