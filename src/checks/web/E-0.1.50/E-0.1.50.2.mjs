import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-0.1.50.2";
export const parentRuleId = "E-0.1.50";

export async function run(context) {
  const { root, packageJson } = context;
  const signals = [
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.scripts ?? {}),
  ].join(" ");
  if (!/(?:browser|lighthouse|puppeteer|smoke|e2e|end-to-end|live)/i.test(signals)) {
    return pass(ruleId);
  }
  try {
    const readme = (await readRepositoryText(context, join(root, "README.md"))).toLowerCase();
    const missing = ["browser", "validation"].filter((term) => !readme.includes(term));
    return missing.length === 0
      ? pass(ruleId)
      : fail(ruleId, `Web acceptance checks are not documented: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "README.md must document web acceptance checks.");
  }
}
