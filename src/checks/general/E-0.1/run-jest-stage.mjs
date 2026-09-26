import { fail, pass } from "../../check-result.mjs";
import { executeJestCheck } from "./E-0.1.20/execute-jest-check.mjs";
import { recordJestContext } from "./E-0.1.20/record-jest-context.mjs";
import { classifyJestResult } from "./E-0.1.20/classify-jest-result.mjs";

export async function runJestStage(context, ruleId) {
  if (!context.executeJest) return pass(ruleId);
  let execution;
  try {
    execution = await executeJestCheck(context);
  } catch (error) {
    return fail(ruleId, `Jest could not be started: ${error.message}`);
  }
  if (execution.error) return fail(ruleId, `Jest could not be started: ${execution.error.message}`);
  recordJestContext(context, execution.result);
  return classifyJestResult(ruleId, context.jestResult, execution.timeoutDiagnostic);
}
