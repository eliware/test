import { fail, pass } from "../../../check-result.mjs";
import { findUnexpectedJestOutput } from "./inspect-jest-output.mjs";

export async function inspectTestProcessOutput(context, ruleId) {
  if (!context.executeJest || context.jestResult?.code !== 0) return pass(ruleId);
  const findings = findUnexpectedJestOutput(context.jestResult);
  if (findings.length === 0) return pass(ruleId);
  return fail(ruleId, `Unexpected test-process output detected: ${findings.join(" | ")}`);
}
