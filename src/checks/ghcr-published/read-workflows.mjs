import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { normalizeWorkflowDocument } from "./normalize-workflow-document.mjs";

const workflowsByContext = new WeakMap();
const workflowsByInventory = new WeakMap();

export function readWorkflows(root, context) {
  if (context?.repositoryInventory) {
    const inventory = context.repositoryInventory;
    const cached = workflowsByInventory.get(inventory);
    if (cached) return cached;
    const pending = loadWorkflows(root, inventory);
    workflowsByInventory.set(inventory, pending);
    return pending;
  }
  if (context && typeof context === "object") {
    const cached = workflowsByContext.get(context);
    if (cached) return cached;
    const pending = loadWorkflows(root);
    workflowsByContext.set(context, pending);
    return pending;
  }
  return loadWorkflows(root);
}

async function loadWorkflows(root, repositoryInventory) {
  const directory = join(root, ".github", "workflows");
  const entries = repositoryInventory
    ? await repositoryInventory.directoryEntries(directory)
    : await readdir(directory, { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && /\.(?:yml|yaml)$/i.test(entry.name))
      .map(async (entry) => {
        const file = join(directory, entry.name);
        const content = repositoryInventory
          ? await repositoryInventory.readText(file)
          : await readFile(file, "utf8");
        const document = repositoryInventory
          ? normalizeWorkflowDocument(await repositoryInventory.readParsed(file, "yaml-document", parse))
          : normalizeWorkflowDocument(parse(content));
        return { name: entry.name, content, document };
      }),
  );
}
