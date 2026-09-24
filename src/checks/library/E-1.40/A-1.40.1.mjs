import { fail, pass } from "../../check-result.mjs";
import { inspectLibraryExamples } from "./inspect-library-examples.mjs";
import { executeLibraryExamples } from "./execute-library-examples.mjs";
import { validateLibraryPackageAllowlist } from "./validate-library-package-allowlist.mjs";

export const ruleId = "A-1.40.1";
export const parentRuleId = "E-1.40";

export async function run({ root, packageJson, executeExample }) {
  try {
    const surface = await inspectLibraryExamples(root);
    if (surface.error) return fail(ruleId, surface.error);
    const executionError = await executeLibraryExamples(root, surface.examples, executeExample);
    if (executionError) return fail(ruleId, executionError);
    const allowlistError = validateLibraryPackageAllowlist(packageJson);
    if (allowlistError) return fail(ruleId, allowlistError);
  } catch {
    return fail(ruleId, "Libraries must provide complete docs/ and examples/ indexes.");
  }
  return pass(ruleId);
}
