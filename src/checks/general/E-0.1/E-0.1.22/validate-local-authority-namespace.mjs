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
    if (!authority || !Array.isArray(authority.subjects)) return "specs/authority.json must assign directive namespaces through a subjects array.";
    const assigned = new Set(
      authority.subjects.flatMap((subject) =>
        (subject.directives ?? []).flatMap((entry) => entry?.ids ?? [])),
    );
    if (assigned.size === 0) return "specs/authority.json must assign at least one directive namespace.";
    const namespaces = new Set(directives.map(({ id }) => namespaceRoot(id)).filter(Boolean));
    const assignedNamespaces = new Set([...assigned].map(namespaceRoot).filter(Boolean));
    const missing = [...namespaces].filter((namespace) => !assignedNamespaces.has(namespace));
    return missing.length > 0
      ? `Directive namespace ${missing.join(", ")} is not assigned by specs/authority.json.`
      : null;
  } catch {
    return "specs/authority.json is required and must contain valid directive namespace assignments.";
  }
}
