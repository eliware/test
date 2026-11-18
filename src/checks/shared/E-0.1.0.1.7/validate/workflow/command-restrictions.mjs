import readCanonicalOrder from "../../../../../validation/shared/conventions/read-canonical-order.mjs";
import validateApprovedPreInstallSteps from "./command-restrictions/approved-pre-install-steps.mjs";
import validatePostTestSteps from "./command-restrictions/post-test-steps.mjs";
import validateRequiredStepInputs from "./command-restrictions/step-inputs.mjs";
import findProhibitedPublishSteps from "./command-restrictions/prohibited-publish-steps.mjs";
export default function validateWorkflowCommandRestrictions(steps, packageJson = {}) {
  const { validationSteps, stepValues } = readCanonicalOrder("ci-workflow.yaml");
  const indexes = validationSteps.map((name, index) =>
    steps.findIndex((step) => (index < 2 ? step.uses : step.run) === stepValues[name]),
  );
  const [checkout, setup, npmInstall, ci, test] = indexes;
  return [
    ...validateRequiredStepInputs(steps, [checkout, setup, npmInstall, ci, test]),
    ...validateApprovedPreInstallSteps(steps, ci),
    ...findProhibitedPublishSteps(steps),
    ...validatePostTestSteps(steps, test, packageJson),
  ];
}
