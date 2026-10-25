export function validateRequiredWorkflowStepConditions(steps, workflowName = "ci.yaml") {
  if (steps.some((step) => step?.if !== undefined || step?.["continue-on-error"] !== undefined))
    return [
      `${workflowName} required validation steps must run unconditionally without continue-on-error.`,
    ];
  return [];
}
