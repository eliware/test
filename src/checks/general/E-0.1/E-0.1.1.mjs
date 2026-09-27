import { readRepositoryParsed } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { readReadmeSections } from "./E-0.1.1/read-readme-sections.mjs";
import {
  expectedReadmeHeadings,
  readmeSectionsCacheKey,
} from "./E-0.1.1/resolve-readme-headings.mjs";

export const ruleId = "E-0.1.1";
export const parentRuleId = "E-0.1";

export async function run(context) {
  const { root } = context;
  let sections;
  try {
    sections = await readRepositoryParsed(
      context,
      join(root, "README.md"),
      readmeSectionsCacheKey(context.packageJson),
      (content) => readReadmeSections(content, expectedReadmeHeadings(context.packageJson)),
    );
  } catch {
    return fail(ruleId, "README.md is required.");
  }
  const features = sections.get("Features");
  const usage = sections.get("Usage");
  if (!features || !usage) {
    return fail(
      ruleId,
      "README.md must describe the project in Features and explain its intended use in Usage.",
    );
  }
  return pass(ruleId);
}
