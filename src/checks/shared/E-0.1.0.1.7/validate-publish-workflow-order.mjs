import { parseAllDocuments } from "yaml";
import { readCanonicalOrder } from "../../../validation/shared/conventions/read-canonical-order.mjs";

const publishPath = ".github/workflows/publish.yaml";

export async function validatePublishWorkflowOrder(inventory, packageJson) {
  const profiles = readCanonicalOrder("publication-workflow.yaml").profiles;
  if (!profiles.some((profile) => packageJson?.eliware?.apply?.includes(profile))) return [];
  if (!inventory?.files || !inventory.readText) return ["publish.yaml could not be inspected."];
  try {
    const files = await inventory.files("all");
    if (!files.includes(publishPath)) return [`${publishPath} is required.`];
    const documents = parseAllDocuments(await inventory.readText(publishPath));
    if (documents.length !== 1 || documents[0].errors.length)
      return [`${publishPath} must contain one valid YAML document.`];
    return validatePublishJobs(documents[0].toJS());
  } catch (error) {
    return [`${publishPath} could not be inspected: ${error.message}`];
  }
}

function validatePublishJobs(document) {
  const order = readCanonicalOrder("publication-workflow.yaml");
  const jobs = document?.jobs ?? {};
  const names = Object.keys(jobs);
  const errors = [];
  if (JSON.stringify(names) !== JSON.stringify(order.jobs))
    errors.push("publish.yaml jobs must list validate before publish.");
  const publishNeeds = jobs.publish?.needs;
  const needsValidation =
    publishNeeds === "validate" ||
    (Array.isArray(publishNeeds) && publishNeeds.includes("validate"));
  if (!needsValidation) errors.push("publish.yaml publish job must depend on validate.");
  const validationError = validatePublicationSteps(jobs.validate?.steps);
  if (validationError) errors.push(validationError);
  return errors;
}

function validatePublicationSteps(steps) {
  if (!Array.isArray(steps)) return "publish.yaml validate job must define steps.";
  const { validationSteps, stepValues } = readCanonicalOrder("ci-workflow.yaml");
  const indexes = [
    steps.findIndex((step) => step?.uses === stepValues[validationSteps[0]]),
    steps.findIndex((step) => step?.uses === stepValues[validationSteps[1]]),
    ...validationSteps
      .slice(2)
      .map((name) => steps.findIndex((step) => step?.run === stepValues[name])),
  ];
  if (
    indexes.some((index) => index < 0) ||
    indexes.some((index, at) => at > 0 && index <= indexes[at - 1])
  )
    return "publish.yaml validate steps must order checkout, setup-node, npm install, npm ci, then npm test.";
  if (indexes[4] !== indexes[3] + 1) return "publish.yaml npm ci must be followed by npm test.";
  if (indexes.at(-1) !== steps.length - 1)
    return "publish.yaml npm test must end the validate job.";
  return null;
}
