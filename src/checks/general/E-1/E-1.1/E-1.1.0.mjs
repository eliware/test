import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { readReadmeSections, expectedReadmeHeadings } from "./read-readme-sections.mjs";
import { validateReadmeBranding } from "./validate-readme-branding.mjs";
import { validateReadmeMetadata } from "./validate-readme-metadata.mjs";
import { validateReadmeRequiredContent } from "./validate-readme-required-content.mjs";
import { inspectReadmeDocumentationIndexes } from "./inspect-readme-documentation-indexes.mjs";

export const ruleId = "E-1.1.0";
export const parentRuleId = "E-1.1";

export async function run({ root, packageJson }) {
  let readme;
  try {
    readme = await readFile(join(root, "README.md"), "utf8");
  } catch {
    return fail(ruleId, "README.md is required.");
  }
  const sections = readReadmeSections(readme, packageJson);
  const missing = expectedReadmeHeadings(packageJson).filter((section) => section !== "Table of Contents" && !sections.get(section));
  if (missing.length > 0) {
    return fail(ruleId, `README.md is missing required sections: ${missing.join(", ")}.`);
  }
  const brandingError = validateReadmeBranding(readme);
  if (brandingError) return fail(ruleId, brandingError);
  const indexes = await inspectReadmeDocumentationIndexes(root);
  const examplesRequired = indexes.examplesRequired;
  const requiredContentError = validateReadmeRequiredContent(readme, packageJson, { examplesRequired });
  if (requiredContentError) return fail(ruleId, requiredContentError);
  const metadataError = validateReadmeMetadata(readme, packageJson);
  if (metadataError) return fail(ruleId, metadataError);
  if (indexes.error) return fail(ruleId, indexes.error);
  return pass(ruleId);
}
