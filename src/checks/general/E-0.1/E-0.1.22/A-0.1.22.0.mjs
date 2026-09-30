import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { validateDirectiveTree } from "./validate-directive-tree.mjs";
import { validateUniqueSpecificationDirectiveIds } from "./validate-unique-specification-directive-ids.mjs";

export const ruleId = "A-0.1.22.0";
export const parentRuleId = "E-0.1.22";

export async function run(context) {
  const { root, repositoryInventory } = context;
  let document;
  try {
    const file = join(root, "specs", "directives.json");
    document = repositoryInventory
      ? await repositoryInventory.readParsed(file, "json", JSON.parse)
      : JSON.parse(await readFile(file, "utf8"));
  } catch {
    return fail(ruleId, "specs/directives.json is required and must be valid JSON.");
  }
  if (!Array.isArray(document.directives) || document.directives.length === 0) {
    return fail(ruleId, "specs/directives.json must contain one or more directives.");
  }
  const errors = validateDirectiveTree(document.directives);
  const uniquenessError = await validateUniqueSpecificationDirectiveIds(root, repositoryInventory);
  if (uniquenessError) errors.push(uniquenessError);
  return errors.length > 0 ? fail(ruleId, errors.join(" ")) : pass(ruleId);
}
