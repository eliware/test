import { parseBoundedYamlDocuments } from "../../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { validateWorkflowSteps } from "./workflow/steps.mjs";
import { validateCiWorkflowEvents } from "./ci-workflow/events.mjs";
import { validateCiWorkflowAccess } from "./ci-workflow/access.mjs";
import { validateCiWorkflowJob } from "./ci-workflow/job.mjs";

const workflowPath = ".github/workflows/ci.yaml";

export async function validateCiWorkflow(inventory, packageJson = {}) {
  if (!inventory?.readText) return ["GitHub workflow files could not be inspected."];
  try {
    const documents = parseBoundedYamlDocuments(
      await inventory.readText(workflowPath),
      workflowPath,
    );
    const parseError = documents.flatMap((document) => document.errors)[0];
    if (parseError) return [`${workflowPath} could not be parsed: ${parseError.message}`];
    if (documents.length !== 1) return [`${workflowPath} must contain exactly one document.`];
    return validateDocument(documents[0].toJS(), packageJson);
  } catch (error) {
    return [`GitHub workflow files could not be inspected: ${error.message}`];
  }
}

function validateDocument(document, packageJson) {
  const jobResult = validateCiWorkflowJob(document);
  return [
    ...validateCiWorkflowEvents(document),
    ...validateCiWorkflowAccess(document, jobResult.job),
    ...jobResult.errors,
    ...(jobResult.job ? validateWorkflowSteps(jobResult.job.steps, packageJson) : []),
  ];
}
