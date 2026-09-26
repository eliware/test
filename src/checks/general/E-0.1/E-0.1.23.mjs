import { join } from "node:path";
import { fail, pass } from "../../check-result.mjs";
import { readRepositoryText } from "../../read-repository-text.mjs";
import { validateApprovedLicense } from "./validate-approved-license.mjs";

export const ruleId = "E-0.1.23";
export const parentRuleId = "E-0.1";

export async function run(context) {
  const { root } = context;
  try {
    const license = await readRepositoryText(context, join(root, "LICENSE"));
    const licenseError = validateApprovedLicense(license);
    if (licenseError) return fail(ruleId, licenseError);
  } catch {
    return fail(ruleId, "LICENSE is required at the repository root.");
  }
  return pass(ruleId);
}
