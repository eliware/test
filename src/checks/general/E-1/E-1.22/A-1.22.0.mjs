import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { validateDirectiveTree } from "./validate-directive-tree.mjs";

export const ruleId = "A-1.22.0";
export const parentRuleId = "E-1.22";

export async function run({ root }) {
  let document;
  try {
    document = JSON.parse(await readFile(join(root, "specs", "directives.json"), "utf8"));
  } catch {
    return fail(ruleId, "specs/directives.json is required and must be valid JSON.");
  }
  if (!Array.isArray(document.directives) || document.directives.length === 0) {
    return fail(ruleId, "specs/directives.json must contain one or more directives.");
  }
  const errors = validateDirectiveTree(document.directives);
  const namespaceError = await validateLocalAuthorityNamespace(root, document.directives);
  if (namespaceError) errors.push(namespaceError);
  return errors.length > 0 ? fail(ruleId, errors.join(" ")) : pass(ruleId);
}

async function validateLocalAuthorityNamespace(root, directives) {
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
