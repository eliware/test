import { fail, pass } from "../../check-result.mjs";
import { inspectLibraryExamples } from "./inspect-library-examples.mjs";
import { executeLibraryExamples } from "./execute-library-examples.mjs";
import { validateLibraryPackageAllowlist } from "./validate-library-package-allowlist.mjs";

export const ruleId = "A-0.1.40.1";
export const parentRuleId = "E-0.1.40";

export async function run(context) {
  const { root, packageJson, executeExample } = context;
  const findings = [];
  let examples;
  try {
    const surface = await inspectLibraryExamples(root, context);
    if (surface.error) findings.push(surface.error);
    else examples = surface.examples;
  } catch (error) {
    findings.push(`Libraries must provide complete docs/ and examples/ indexes: ${error.message}`);
  }
  if (examples) {
    try {
      const executionError = await executeLibraryExamples(root, examples, executeExample);
      if (executionError) findings.push(executionError);
    } catch (error) {
      findings.push(`Library examples could not be executed: ${error.message}`);
    }
  }
  const allowlistError = validateLibraryPackageAllowlist(packageJson);
  if (allowlistError) findings.push(allowlistError);
  return findings.length ? fail(ruleId, findings.join("\n")) : pass(ruleId);
}
