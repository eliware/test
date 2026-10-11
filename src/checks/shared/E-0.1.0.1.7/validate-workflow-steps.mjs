import { validateWorkflowCommandRestrictions } from "./validate-workflow-command-restrictions.mjs";
import { validateWorkflowStepFields } from "./validate-workflow-step-fields.mjs";
import { validateWorkflowStepOrder } from "./validate-workflow-step-order.mjs";

export function validateWorkflowSteps(steps) {
  const normalized = steps.map((step) => step ?? {});
  return [
    ...validateWorkflowStepFields(steps),
    ...validateWorkflowStepOrder(normalized),
    ...validateWorkflowCommandRestrictions(normalized),
  ];
}
