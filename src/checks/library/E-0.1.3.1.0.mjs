import { fail, pass } from "../check-result.mjs";
import { validateLibraryExamples } from "./E-0.1.3.1.0/validate-library/examples.mjs";
import { validateLibraryExamplesLink } from "./E-0.1.3.1.0/validate-library/examples-link.mjs";
import { validateProfileDocumentation } from "../../validation/shared/conventions/validate/profile/documentation.mjs";

export const ruleId = "E-0.1.3.1.0";
export const repositoryInventoryOptions = { expandedDirectories: ["examples"] };

export async function run(context = {}) {
  const errors = await validateProfileDocumentation("library", context.repositoryInventory);
  errors.push(...(await validateLibraryExamples(context)));
  errors.push(...(await validateLibraryExamplesLink(context)));
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
