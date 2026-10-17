import { parseBoundedYamlDocuments } from "../../../validation/shared/yaml/parse-bounded-yaml-documents.mjs";
import { findNpmTokenSettings } from "./find-npm-token-settings.mjs";
import {
  hasNpmProvenancePermission,
  hasNpmValidationReadPermissions,
  hasNpmWorkflowReadPermissions,
} from "./validate-npm-publish-workflow/has-npm-provenance-permission.mjs";
import { validateNpmPublishSteps } from "./validate-npm-publish-workflow/steps.mjs";

const workflowPath = ".github/workflows/publish.yaml";

export async function validateNpmPublishWorkflow(inventory, packageJson = {}) {
  if (!inventory?.files || !inventory.readText) return ["publish.yaml could not be inspected."];
  try {
    if (!(await inventory.files("all")).includes(workflowPath))
      return [`${workflowPath} is required.`];
    const documents = parseBoundedYamlDocuments(
      await inventory.readText(workflowPath),
      workflowPath,
    );
    if (documents.length !== 1 || documents[0].errors.length)
      return [`${workflowPath} must contain one valid YAML document.`];
    return validateWorkflow(documents[0].toJS(), packageJson);
  } catch (error) {
    return [`${workflowPath} could not be inspected: ${error.message}`];
  }
}

function validateWorkflow(document, packageJson) {
  const errors = findNpmTokenSettings(document);
  if (!hasNpmWorkflowReadPermissions(document))
    errors.push("npm workflow permissions must contain only contents: read.");
  if (!hasNpmValidationReadPermissions(document))
    errors.push("npm validation job permissions must contain only contents: read.");
  if (!hasNpmProvenancePermission(document))
    errors.push("npm publish job must set contents: read and id-token: write for provenance.");
  return [...errors, ...validateNpmPublishSteps(document, packageJson.version)];
}
