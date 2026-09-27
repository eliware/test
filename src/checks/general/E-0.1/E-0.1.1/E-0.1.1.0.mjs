import { readRepositoryParsed, readRepositoryText } from "../../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import {
  readReadmeSections,
} from "./read-readme-sections.mjs";
import { expectedReadmeHeadings, readmeSectionsCacheKey } from "./resolve-readme-headings.mjs";
import { findMissingReadmeSections } from "./find-missing-readme-sections.mjs";
import { validateReadmeBranding } from "./validate-readme-branding.mjs";
import { validateReadmeMetadata } from "./validate-readme-metadata.mjs";
import { validateReadmeRequiredContent } from "./validate-readme-required-content.mjs";
import { inspectReadmeDocumentationIndexes } from "./inspect-readme-documentation-indexes.mjs";

export const ruleId = "E-0.1.1.0";
export const parentRuleId = "E-0.1.1";

export async function run(context) {
  const { root, packageJson } = context;
  let readme;
  try {
    readme = await readRepositoryText(context, join(root, "README.md"));
  } catch {
    return fail(ruleId, "README.md is required.");
  }
  const sections = await readRepositoryParsed(
    context,
    join(root, "README.md"),
    readmeSectionsCacheKey(packageJson),
    (content) => readReadmeSections(content, expectedReadmeHeadings(packageJson)),
  );
  const missing = findMissingReadmeSections(sections, packageJson);
  if (missing.length > 0) {
    return fail(ruleId, `README.md is missing required sections: ${missing.join(", ")}.`);
  }
  const brandingError = validateReadmeBranding(readme);
  if (brandingError) return fail(ruleId, brandingError);
  const indexes = await inspectReadmeDocumentationIndexes(root);
  const examplesRequired = indexes.examplesRequired;
  const requiredContentError = validateReadmeRequiredContent(readme, packageJson, {
    examplesRequired,
    sections,
  });
  if (requiredContentError) return fail(ruleId, requiredContentError);
  const metadataError = validateReadmeMetadata(readme, packageJson);
  if (metadataError) return fail(ruleId, metadataError);
  if (indexes.error) return fail(ruleId, indexes.error);
  return pass(ruleId);
}
