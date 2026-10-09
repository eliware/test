import { parseAllDocuments } from "yaml";

const workflowPath = ".github/workflows/publish.yaml";

export async function readGhcrPublishWorkflow(inventory) {
  if (!inventory?.files || !inventory.readText)
    return { error: "publish.yaml could not be inspected." };
  try {
    if (!(await inventory.files("all")).includes(workflowPath))
      return { error: `${workflowPath} is required.` };
    const documents = parseAllDocuments(await inventory.readText(workflowPath));
    if (documents.length !== 1 || documents[0].errors.length)
      return { error: `${workflowPath} must contain one valid YAML document.` };
    return { workflow: documents[0].toJS() };
  } catch (error) {
    return { error: `${workflowPath} could not be inspected: ${error.message}` };
  }
}
