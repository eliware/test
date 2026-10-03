import { fail, pass } from "../../../check-result.mjs";
import { validateMarkdownLinks } from "../../../documentation/E-0.1.100/validate-markdown-links.mjs";
import { collectReadmeFiles } from "./collect-readme-files.mjs";

export const ruleId = "A-0.1.1.1";
export const parentRuleId = "E-0.1.1";
export const repositoryInventoryOptions = Object.freeze({ includeTestResults: true });

export async function run(context) {
  try {
    const files = await collectReadmeFiles(context.root, context.repositoryInventory);
    const error = await validateMarkdownLinks(context.root, files, context);
    return error ? fail(ruleId, error) : pass(ruleId);
  } catch (error) {
    return fail(ruleId, `README link validation failed: ${error.message}`);
  }
}
