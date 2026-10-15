import { parseBoundedYamlDocuments } from "../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";

const workflowPath = ".github/workflows/publish.yaml";

export async function readGhcrPublishWorkflow(inventory) {
  if (!inventory?.files || !inventory.readText)
    return { error: "publish.yaml could not be inspected." };
  try {
    if (!(await inventory.files("all")).includes(workflowPath))
      return { error: `${workflowPath} is required.` };
    const documents = parseBoundedYamlDocuments(
      await inventory.readText(workflowPath),
      workflowPath,
    );
    if (documents.length !== 1 || documents[0].errors.length)
      return { error: `${workflowPath} must contain one valid YAML document.` };
    return { workflow: documents[0].toJS() };
  } catch (error) {
    return { error: `${workflowPath} could not be inspected: ${error.message}` };
  }
}
