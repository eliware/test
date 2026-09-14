import { readFile } from "node:fs/promises";
import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";

export const ruleId = "E-1.50.2";
export const parentRuleId = "E-1.50";

export async function run({ root, packageJson }) {
  const signals = [
    ...Object.keys(packageJson?.dependencies ?? {}),
    ...Object.keys(packageJson?.devDependencies ?? {}),
    ...Object.keys(packageJson?.scripts ?? {}),
  ].join(" ");
  if (!/(?:browser|lighthouse|puppeteer|smoke|e2e|end-to-end|live)/i.test(signals)) {
    return pass(ruleId);
  }
  try {
    const readme = (await readFile(join(root, "README.md"), "utf8")).toLowerCase();
    const missing = ["browser", "validation"].filter((term) => !readme.includes(term));
    return missing.length === 0
      ? pass(ruleId)
      : fail(ruleId, `Web acceptance checks are not documented: ${missing.join(", ")}.`);
  } catch {
    return fail(ruleId, "README.md must document web acceptance checks.");
  }
}
