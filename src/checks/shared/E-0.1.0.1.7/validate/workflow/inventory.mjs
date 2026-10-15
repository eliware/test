const workflowPath = ".github/workflows/ci.yaml";
const publishPath = ".github/workflows/publish.yaml";

export async function validateWorkflowInventory(inventory, packageJson = {}) {
  if (!inventory?.files) return ["GitHub workflow files could not be inspected."];
  try {
    const files = (await inventory.files("all")).filter((path) =>
      path.startsWith(".github/workflows/"),
    );
    const published = ["npm-published", "ghcr-published"].some((profile) =>
      packageJson?.eliware?.apply?.includes(profile),
    );
    const allowed = published ? [workflowPath, publishPath] : [workflowPath];
    const errors = files
      .filter((file) => !allowed.includes(file))
      .map((file) => `Unexpected workflow file: ${file}.`);
    if (!files.includes(workflowPath)) errors.push(`${workflowPath} is required.`);
    return errors;
  } catch (error) {
    return [`GitHub workflow files could not be inspected: ${error.message}`];
  }
}
