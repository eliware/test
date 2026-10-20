import { fail, pass } from "../check-result.mjs";
import { validateDocumentationIndexes } from "./E-0.1.0.1.12/validate/documentation-indexes.mjs";

export const ruleId = "E-0.1.0.1.12";
export const repositoryInventoryOptions = { expandedDirectories: ["docs"] };

export async function run(context = {}) {
  const errors = await validateDocumentationIndexes(context);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
