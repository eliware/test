import validateCanonicalPublisherWorkflow from "../../shared/publish-workflow/validate/canonical-publisher-workflow.mjs";
export default function validateNpmPublishWorkflow(inventory) {
  return validateCanonicalPublisherWorkflow(inventory, "npm-published");
}
