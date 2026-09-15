import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { directiveIdPattern } from "./contract-schema.mjs";

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
    if (Array.isArray(record.ids) && record.ids.some((id) => typeof id !== "string" || !directiveIdPattern.test(id))) {
      return { error: "Linked directive authority contains invalid directive IDs." };
    }
    if (typeof record.path !== "string" || !record.path.trim()) {
      if (Array.isArray(record.ids) && record.ids.length > 0) return { error: "Linked directive authority IDs must resolve through a directive document path." };
      continue;
    }
    try {
      const linked = JSON.parse(await readFile(resolve(dirname(authorityPath), record.path), "utf8"));
      collect(linked, ids);
      if ([...ids].some((id) => !directiveIdPattern.test(id))) {
        return { error: `Linked directive document ${record.path} contains an invalid directive ID.` };
      }
      if (Array.isArray(record.ids) && record.ids.some((id) => !ids.has(id))) {
        return { error: `Linked directive authority IDs do not resolve from ${record.path}.` };
      }
    } catch (error) {
      if (error.code !== "ENOENT") return { error: `Linked directive document ${record.path} is invalid: ${error.message}` };
    }
  }
  return { ids };
}
