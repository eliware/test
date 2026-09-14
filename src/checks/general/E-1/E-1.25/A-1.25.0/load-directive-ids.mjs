import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { loadLinkedDirectiveIds } from "./load-linked-directive-ids.mjs";

function collect(node, ids) {
  if (!node || typeof node !== "object") return;
  if (typeof node.id === "string") ids.add(node.id);
  for (const child of node.directives ?? []) collect(child, ids);
}

export async function loadDirectiveIds(root) {
  const path = join(root, "specs", "directives.json");
  try {
    const document = JSON.parse(await readFile(path, "utf8"));
    const ids = new Set();
    collect(document, ids);
    const linked = await loadLinkedDirectiveIds(root);
    if (linked.error) return linked;
    for (const id of linked.ids) ids.add(id);
    return { ids };
  } catch (error) {
    if (error.code === "ENOENT") {
      const linked = await loadLinkedDirectiveIds(root);
      if (linked.error) return linked;
      return linked.ids.size > 0 ? linked : { ids: null };
    }
    return { error: `specs/directives.json is invalid: ${error.message}` };
  }
}
