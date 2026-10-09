import { fail, pass } from "../check-result.mjs";
import { validateApplicationDocumentation } from "../application/E-0.1.4.1.0/validate-application-documentation.mjs";
import { validateLibraryExamples } from "./E-0.1.3.1.0/validate-library-examples.mjs";
import { validateLibraryExamplesLink } from "./E-0.1.3.1.0/validate-library-examples-link.mjs";

export const ruleId = "E-0.1.3.1.0";
export const repositoryInventoryOptions = { expandedDirectories: ["docs", "examples"] };

export async function run(context = {}) {
  const errors = await validateApplicationDocumentation(context);
  errors.push(...(await validateLibraryExamples(context)));
  errors.push(...(await validateLibraryExamplesLink(context)));
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
