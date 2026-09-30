import { fail, pass } from "../../../check-result.mjs";
import { collectRedactionSecrets } from "../../../collect-redaction-secrets.mjs";
import { findUnexpectedJestOutput } from "./inspect-jest-output.mjs";

export async function inspectTestProcessOutput(context, ruleId) {
  if (!context.executeJest || context.jestResult?.code !== 0) return pass(ruleId);
  const findings = findUnexpectedJestOutput(
    context.jestResult,
    collectRedactionSecrets(context.env ?? process.env),
    context.root,
  );
  if (findings.length === 0) return pass(ruleId);
  return fail(ruleId, `Unexpected test-process output detected: ${findings.join(" | ")}`);
}
