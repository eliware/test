import { fail, pass } from "../../../check-result.mjs";
import { loadReadmeValidationInputs } from "./load-readme-validation-inputs.mjs";
import { findMissingReadmeSections } from "./find-missing-readme-sections.mjs";
import { validateReadmeBranding } from "./validate-readme-branding.mjs";
import { validateReadmeMetadata } from "./validate-readme-metadata.mjs";
import { validateReadmeRequiredContent } from "./validate-readme-required-content.mjs";
import { inspectReadmeDocumentationIndexes } from "./inspect-readme-documentation-indexes.mjs";

export const ruleId = "E-0.1.1.0";
export const parentRuleId = "E-0.1.1";

export async function run(context) {
  const inputs = await loadReadmeValidationInputs(context);
  if (!inputs) return fail(ruleId, "README.md is required.");
  const { readme, sections } = inputs;
  const { root, packageJson } = context;
  const failures = [];
  const missing = findMissingReadmeSections(sections, packageJson);
  if (missing.length > 0)
    failures.push(`README.md is missing required sections: ${missing.join(", ")}.`);
  const brandingError = validateReadmeBranding(readme);
  if (brandingError) failures.push(brandingError);
  const indexes = await inspectReadmeDocumentationIndexes(root);
  const examplesRequired = indexes.examplesRequired;
  const requiredContentError = validateReadmeRequiredContent(readme, packageJson, {
    examplesRequired,
    sections,
  });
  if (requiredContentError) failures.push(requiredContentError);
  const metadataError = validateReadmeMetadata(readme, packageJson);
  if (metadataError) failures.push(metadataError);
  if (indexes.error) failures.push(indexes.error);
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
