import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../check-result.mjs";
import { resolveReadmeHeadings } from "./E-0.1.0.1.3/resolve-readme-headings.mjs";
import { validateReadmeStructure } from "./E-0.1.0.1.3/validate-readme-structure.mjs";
import { validateReadmeBranding } from "./E-0.1.0.1.3/validate-readme-branding.mjs";
import { validateReadmeMetadata } from "./E-0.1.0.1.3/validate-readme-metadata.mjs";
import { validateReadmeLinks } from "./E-0.1.0.1.3/validate-readme-links.mjs";

export const ruleId = "E-0.1.0.1.3";
export const ownerProfile = "general";
export const requiredProfiles = ["general"];

export async function run(context = {}, dependencies = {}) {
  const root = context.root ?? process.cwd();
  let readme;
  try {
    readme = await (dependencies.read ?? readFile)(join(root, "README.md"), "utf8");
  } catch {
    return fail(ruleId, "README.md is required.");
  }
  const headings = resolveReadmeHeadings(context.packageJson);
  const errors = [
    validateReadmeStructure(readme, headings, context.packageJson),
    validateReadmeBranding(readme, context.packageJson),
    validateReadmeMetadata(readme, context.packageJson),
    validateReadmeLinks(readme, context.packageJson),
  ].filter(Boolean);
  return errors.length ? fail(ruleId, errors.join("\n")) : pass(ruleId);
}
