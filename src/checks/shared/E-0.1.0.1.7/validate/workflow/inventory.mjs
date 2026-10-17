import { readCanonicalOrder } from "../../../../../validation/shared/conventions/read-canonical-order.mjs";

const workflowPath = ".github/workflows/ci.yaml";

export async function validateWorkflowInventory(inventory, packageJson = {}) {
  if (!inventory?.files) return ["GitHub workflow files could not be inspected."];
  try {
    const files = (await inventory.files("all")).filter((path) =>
      path.startsWith(".github/workflows/"),
    );
    const workflowFiles = readCanonicalOrder("publication-workflow.yaml").workflowFiles;
    const applied = packageJson?.eliware?.apply ?? [];
    const publisherFiles = Object.entries(workflowFiles)
      .filter(([profile]) => applied.includes(profile))
      .map(([, file]) => `.github/workflows/${file}`);
    const allowed = [workflowPath, ...publisherFiles];
    const errors = files
      .filter((file) => !allowed.includes(file))
      .map((file) => `Unexpected workflow file: ${file}.`);
    if (!files.includes(workflowPath)) errors.push(`${workflowPath} is required.`);
    return errors;
  } catch (error) {
    return [`GitHub workflow files could not be inspected: ${error.message}`];
  }
}
