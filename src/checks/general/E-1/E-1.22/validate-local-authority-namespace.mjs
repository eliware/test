import { readFile } from "node:fs/promises";
import { join } from "node:path";

export async function validateLocalAuthorityNamespace(root, directives) {
  try {
    const authority = JSON.parse(await readFile(join(root, "specs", "authority.json"), "utf8"));
    const assigned = new Set(
      (authority.subjects ?? []).flatMap((subject) =>
        (subject.directives ?? []).flatMap((entry) => entry?.ids ?? [])),
    );
    if (assigned.size === 0) return null;
    const namespaces = new Set(directives.map(({ id }) => id.match(/^[EA]-\d+/u)?.[0]).filter(Boolean));
    const missing = [...namespaces].filter((namespace) => ![...assigned].some((id) => id.startsWith(namespace)));
    return missing.length > 0
      ? `Directive namespace ${missing.join(", ")} is not assigned by specs/authority.json.`
      : null;
  } catch {
    return null;
  }
}
