import { readdir, readFile } from "node:fs/promises";
import { join } from "node:path";
import { parse } from "yaml";
import { normalizeWorkflowDocument } from "./normalize-workflow-document.mjs";

const workflowsByContext = new WeakMap();

export function readWorkflows(root, context) {
  if (context && typeof context === "object") {
    const cached = workflowsByContext.get(context);
    if (cached) return cached;
    const pending = loadWorkflows(root);
    workflowsByContext.set(context, pending);
    return pending;
  }
  return loadWorkflows(root);
}

async function loadWorkflows(root) {
  const directory = join(root, ".github", "workflows");
  const entries = await readdir(directory, { withFileTypes: true });
  return Promise.all(
    entries
      .filter((entry) => entry.isFile() && /\.(?:yml|yaml)$/i.test(entry.name))
      .map(async (entry) => {
        const content = await readFile(join(directory, entry.name), "utf8");
        return { name: entry.name, content, document: normalizeWorkflowDocument(parse(content)) };
      }),
  );
}
