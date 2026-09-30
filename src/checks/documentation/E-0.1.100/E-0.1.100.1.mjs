import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.100.1";
export const parentRuleId = "E-0.1.100";
export async function run(context) {
  const { root } = context;
  const failures = [];
  let rootReadme;
  try {
    rootReadme = await readRepositoryText(context, join(root, "README.md"));
  } catch {
    failures.push("Root README.md is required for documentation indexing.");
  }
  try {
    await readRepositoryText(context, join(root, "specs", "README.md"));
  } catch {
    failures.push("specs/README.md is required for structured documentation indexing.");
  }
  if (rootReadme && !/\[[^\]]+\]\((?:\.\/)?specs\/README\.md\)/u.test(rootReadme))
    failures.push("Root README.md must link specs/README.md.");
  return failures.length ? fail(ruleId, failures.join("\n")) : pass(ruleId);
}
