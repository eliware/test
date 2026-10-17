import { validateWorkflowCommandRestrictions } from "./command-restrictions.mjs";
import { validateWorkflowStepFields } from "./step/fields.mjs";
import { validateWorkflowStepOrder } from "./step/order.mjs";

export function validateWorkflowSteps(steps, packageJson = {}) {
  const normalized = steps.map((step) => step ?? {});
  return [
    ...validateWorkflowStepFields(steps),
    ...validateWorkflowStepOrder(normalized),
    ...validateWorkflowCommandRestrictions(normalized, packageJson),
  ];
}
