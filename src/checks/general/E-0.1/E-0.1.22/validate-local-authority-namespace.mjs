import { readFile } from "node:fs/promises";
import { join } from "node:path";

function namespaceRoot(id) {
  return id.match(/^[EA]-\d+(?=\.|$)/iu)?.[0].toUpperCase();
}

export async function validateLocalAuthorityNamespace(root, directives, repositoryInventory) {
  try {
    const file = join(root, "specs", "authority.json");
    const authority = repositoryInventory
      ? await repositoryInventory.readParsed(file, "json", JSON.parse)
      : JSON.parse(await readFile(file, "utf8"));
    const assigned = new Set(
      (authority.subjects ?? []).flatMap((subject) =>
        (subject.directives ?? []).flatMap((entry) => entry?.ids ?? [])),
    );
    if (assigned.size === 0) return null;
    const namespaces = new Set(directives.map(({ id }) => namespaceRoot(id)).filter(Boolean));
    const assignedNamespaces = new Set([...assigned].map(namespaceRoot).filter(Boolean));
    const missing = [...namespaces].filter((namespace) => !assignedNamespaces.has(namespace));
    return missing.length > 0
      ? `Directive namespace ${missing.join(", ")} is not assigned by specs/authority.json.`
      : null;
  } catch {
    return null;
  }
}
