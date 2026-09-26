import { fail, pass } from "../../check-result.mjs";
import { jsonFiles } from "./documentation-surface.mjs";
import { validateAuthoritySurfaces } from "./validate-authority-surfaces.mjs";
import { validateDocumentationLinks } from "./validate-documentation-links.mjs";
import { validateStructuredReferences } from "./validate-structured-references.mjs";

export const ruleId = "A-0.1.100.3";
export const parentRuleId = "E-0.1.100";
export const repositoryInventoryOptions = Object.freeze({ includeTestResults: true });

export async function run(context) {
  const { root } = context;
  try {
    const files = await jsonFiles(root, context.repositoryInventory);
    await validateStructuredReferences(root, files, context.repositoryInventory);
    const authorityError = await validateAuthoritySurfaces(root, files, context.repositoryInventory);
    if (authorityError) return fail(ruleId, authorityError);
    const linkError = await validateDocumentationLinks(root, context);
    if (linkError) return fail(ruleId, linkError);
  } catch (error) {
    return fail(ruleId, `Documentation reference validation failed: ${error.message}`);
  }
  return pass(ruleId);
}
