import { fail, pass } from "../../check-result.mjs";
import { executeJestCheck } from "./E-1.20/execute-jest-check.mjs";
import { recordJestContext } from "./E-1.20/record-jest-context.mjs";
import { classifyJestResult } from "./E-1.20/classify-jest-result.mjs";

export async function runJestStage(context, ruleId) {
  if (!context.executeJest) return pass(ruleId);
  const execution = await executeJestCheck(context);
  if (execution.error) return fail(ruleId, `Jest could not be started: ${execution.error.message}`);
  recordJestContext(context, execution.result);
  return classifyJestResult(ruleId, context.jestResult, execution.timeoutDiagnostic);
}
