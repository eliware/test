import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

export function validateWorkflowStepOrder(steps) {
  const { validationSteps, stepValues } = readCanonicalOrder("ci-workflow.yaml");
  const indexes = validationSteps.map((name, index) =>
    steps.findIndex((step) => (index < 2 ? step.uses : step.run) === stepValues[name]),
  );
  const [checkout, setup, npmInstall, ci, test] = indexes;
  const errors = [];
  if (
    checkout < 0 ||
    setup <= checkout ||
    setup < 0 ||
    npmInstall <= setup ||
    ci <= npmInstall ||
    test !== ci + 1 ||
    validationSteps.some(
      (name, index) =>
        steps.filter((step) => (index < 2 ? step.uses : step.run) === stepValues[name]).length !==
        1,
    )
  )
    errors.push("ci.yaml must use checkout v6, setup-node v7, npm latest, npm ci, then npm test.");
  if (test >= 0 && test !== steps.length - 1)
    errors.push("ci.yaml npm test must be the final validation-job step.");
  return errors;
}
