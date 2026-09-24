import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { validateDirectiveTree } from "./validate-directive-tree.mjs";
import { validateLocalAuthorityNamespace } from "./validate-local-authority-namespace.mjs";

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
