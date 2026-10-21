import { fail, pass } from "../../../../../../checks/check-result.mjs";
import { executeJestCheck } from "../../execute/jest-check.mjs";
import { recordJestContext } from "../../record-jest-context.mjs";
import { classifyJestResult } from "../../classify-jest-result.mjs";
import { validateTestIsolationPolicy } from "../../../../../harness/validate-test-isolation-policy.mjs";

export async function runJestStage(context, ruleId) {
  if (!context.executeJest) return pass(ruleId);
  const isolationViolations = await validateTestIsolationPolicy(context.root);
  if (isolationViolations.length) return fail(ruleId, isolationViolations.join("\n"));
  context.jestFailureDetailsReported = false;
  let execution;
  try {
    execution = await executeJestCheck(context);
  } catch (error) {
    return fail(ruleId, `Jest could not be started: ${error.message}`);
  }
  if (execution.error) {
    context.jestExecutionError = execution.error.message;
    return fail(ruleId, `Jest could not be started: ${execution.error.message}`);
  }
  recordJestContext(context, execution.result);
  return classifyJestResult(ruleId, context.jestResult, execution.timeoutDiagnostic, {
    failuresReported: context.jestFailureDetailsReported,
  });
}
