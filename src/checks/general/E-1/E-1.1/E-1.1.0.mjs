import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../../check-result.mjs";
import { readReadmeSections, requiredReadmeSections } from "./read-readme-sections.mjs";
import { validateReadmeBranding } from "./validate-readme-branding.mjs";
import { validateReadmeMetadata } from "./validate-readme-metadata.mjs";

export const ruleId = "E-1.1.0";
export const parentRuleId = "E-1.1";

export async function run({ root, packageJson }) {
  let readme;
  try {
    readme = await readFile(join(root, "README.md"), "utf8");
  } catch {
    return fail(ruleId, "README.md is required.");
  }
  const sections = readReadmeSections(readme);
  const missing = requiredReadmeSections.filter((section) => !sections.get(section));
  if (missing.length > 0) {
    return fail(ruleId, `README.md is missing required sections: ${missing.join(", ")}.`);
  }
  const brandingError = validateReadmeBranding(readme);
  if (brandingError) return fail(ruleId, brandingError);
  const metadataError = validateReadmeMetadata(readme, packageJson);
  if (metadataError) return fail(ruleId, metadataError);
  return pass(ruleId);
}
