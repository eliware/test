import { fail, pass } from "../check-result.mjs";
import { validateExamplesIndex } from "./E-0.1.4.1.0/validate/examples-index.mjs";
import { validateProfileDocumentation } from "../../validation/shared/conventions/validate/profile/documentation.mjs";

export const ruleId = "E-0.1.4.1.0";
export const repositoryInventoryOptions = { expandedDirectories: ["examples"] };

export async function run(context = {}) {
  const errors = await validateExamplesIndex(context);
  errors.push(...(await validateProfileDocumentation("application", context.repositoryInventory)));
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
