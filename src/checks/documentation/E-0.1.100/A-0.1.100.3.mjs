import { fail, pass } from "../../check-result.mjs";
import { jsonFiles } from "./collect-documentation-files.mjs";
import { validateDocumentationLinks } from "./validate-documentation-links.mjs";
import { validateStructuredReferences } from "./validate-structured-references.mjs";

export const ruleId = "A-0.1.100.3";
export const parentRuleId = "E-0.1.100";
export const repositoryInventoryOptions = Object.freeze({ includeTestResults: true });

export async function run(context) {
  const { root } = context;
  const failures = [];
  let files;
  try {
    files = await jsonFiles(root, context.repositoryInventory);
  } catch (error) {
    failures.push(`Documentation reference discovery failed: ${error.message}`);
  }
  if (files) {
    try {
      const error = await validateStructuredReferences(root, files, context.repositoryInventory);
      if (error) failures.push(error);
    } catch (error) {
      failures.push(`Structured reference validation failed: ${error.message}`);
    }
  }
  try {
    const error = await validateDocumentationLinks(root, context);
    if (error) failures.push(error);
  } catch (error) {
    failures.push(`Documentation link validation failed: ${error.message}`);
  }
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
