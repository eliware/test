import pass from "../../../../../checks/check-result.mjs";
import classifyJestOutputFailure from "./output-failure.mjs";
import classifyJestProcessFailure from "./process-failure.mjs";
export default function classifyJestResult(ruleId, result, timeoutDiagnostic) {
  return (
    classifyJestOutputFailure(ruleId, result) ??
    classifyJestProcessFailure(ruleId, result, timeoutDiagnostic) ??
    pass(ruleId)
  );
}
