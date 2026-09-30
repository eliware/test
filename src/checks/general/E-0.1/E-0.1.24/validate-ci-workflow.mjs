import { workflowHasValidationEvents } from "./workflow-validation-events.mjs";

export function validateCiWorkflow(workflows) {
  const workflow = workflows.find(
    ({ name, document }) => name === "ci.yml" && workflowHasValidationEvents(document),
  );
  return workflow
    ? null
    : "A GitHub Actions workflow must validate pull requests and pushes to main on Ubuntu.";
}
