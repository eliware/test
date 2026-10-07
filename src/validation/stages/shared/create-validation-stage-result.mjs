export function createValidationStageResult(stage, code, message, output) {
  return {
    ruleId: `stage:${stage}`,
    stage,
    code,
    status: code === 0 ? "pass" : "fail",
    message,
    output,
  };
}
