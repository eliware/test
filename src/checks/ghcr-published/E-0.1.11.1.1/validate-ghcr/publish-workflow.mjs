import { validateCanonicalPublisherWorkflow } from "../../../shared/publish-workflow/validate-canonical-publisher-workflow.mjs";

export async function validateGhcrPublishWorkflow(inventory) {
  if (!inventory?.files) return ["Repository files could not be inspected."];
  try {
    if (!(await inventory.files("all")).includes("Dockerfile"))
      return ["Repository root must contain Dockerfile."];
    return await validateCanonicalPublisherWorkflow(inventory, "ghcr-published");
  } catch (error) {
    return [`Repository files could not be inspected: ${error.message}`];
  }
}
