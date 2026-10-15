export function finalizeValidationRun({ result, planFailure }) {
  if (!planFailure) return result;
  const message =
    planFailure.error instanceof Error ? planFailure.error.message : String(planFailure.error);
  return [{ ruleId: "E-0.1.20", status: "fail", message }];
}
