import { fail, pass } from "../../../../../../checks/check-result.mjs";
import { executeJestCheck } from "../../execute/jest-check.mjs";
import { recordJestContext } from "../../record-jest-context.mjs";
import { classifyJestResult } from "../../classify-jest-result.mjs";
import { validateTestWritePolicy } from "../../../../../harness/validate-test-write-policy.mjs";

export async function runJestStage(context, ruleId) {
  if (!context.executeJest) return pass(ruleId);
  const writeViolations = await validateTestWritePolicy(context.root);
  if (writeViolations.length) return fail(ruleId, writeViolations.join("\n"));
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
    failuresReported: typeof context.writeOutput === "function",
  });
}
