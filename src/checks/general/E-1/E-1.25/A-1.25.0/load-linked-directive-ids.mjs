import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";

function collect(node, ids) {
  if (!node || typeof node !== "object") return;
  if (typeof node.id === "string") ids.add(node.id);
  for (const child of node.directives ?? []) collect(child, ids);
}

export async function loadLinkedDirectiveIds(root) {
  const authorityPath = resolve(root, "specs", "authority.json");
  let authority;
  try {
    authority = JSON.parse(await readFile(authorityPath, "utf8"));
  } catch (error) {
    if (error.code === "ENOENT") return { ids: new Set() };
    return { error: `specs/authority.json is invalid: ${error.message}` };
  }
  const ids = new Set();
  const records = (authority.subjects ?? []).flatMap((subject) =>
    Array.isArray(subject?.directives) ? subject.directives : [],
  );
  for (const record of records) {
    if (Array.isArray(record.ids)) {
      for (const id of record.ids) if (typeof id === "string") ids.add(id);
    }
    if (typeof record.path !== "string") continue;
    try {
      const linked = JSON.parse(await readFile(resolve(dirname(authorityPath), record.path), "utf8"));
      collect(linked, ids);
    } catch (error) {
      if (error.code !== "ENOENT") return { error: `Linked directive document ${record.path} is invalid: ${error.message}` };
    }
  }
  return { ids };
}
