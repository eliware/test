import { parseAllDocuments } from "yaml";
import { findNpmTokenSettings } from "./find-npm-token-settings.mjs";

const workflowPath = ".github/workflows/publish.yaml";

export async function validateNpmPublishWorkflow(inventory) {
  if (!inventory?.files || !inventory.readText) return ["publish.yaml could not be inspected."];
  try {
    if (!(await inventory.files("all")).includes(workflowPath))
      return [`${workflowPath} is required.`];
    const documents = parseAllDocuments(await inventory.readText(workflowPath));
    if (documents.length !== 1 || documents[0].errors.length)
      return [`${workflowPath} must contain one valid YAML document.`];
    return validateWorkflow(documents[0].toJS());
  } catch (error) {
    return [`${workflowPath} could not be inspected: ${error.message}`];
  }
}

function validateWorkflow(document) {
  const errors = findNpmTokenSettings(document);
  const steps = document?.jobs?.publish?.steps;
  if (!Array.isArray(steps)) return [...errors, "publish.yaml publish job must define steps."];
  const setup = steps.filter(
    (step) => typeof step?.uses === "string" && step.uses.startsWith("actions/setup-node@"),
  );
  if (setup.length !== 1 || !validSetup(setup[0]))
    errors.push("npm publish job must use setup-node v7 with Node.js 26 and the npm registry.");
  const install = steps.findIndex((step) => step?.run === "npm -g install npm@latest");
  const ci = steps.findIndex((step) => step?.run === "npm ci");
  const publish = steps.filter(
    (step) => typeof step?.run === "string" && /\bnpm publish\b/u.test(step.run),
  );
  if (
    install < 0 ||
    ci <= install ||
    setup.length !== 1 ||
    steps.indexOf(setup[0]) >= install ||
    [install, ci].some((index) => !unconditional(steps[index]))
  )
    errors.push("npm publisher must install npm latest before npm ci after setup-node.");
  if (publish.length !== 1 || !validPublishStep(publish[0]))
    errors.push(
      "npm publisher must have one unconditional standalone npm publish --provenance step.",
    );
  return errors;
}

function validSetup(step) {
  const input = step?.with;
  const validInputCount = Object.keys(input ?? {}).length === 3;
  return (
    step?.uses === "actions/setup-node@v7" &&
    [26, "26"].includes(input?.["node-version"]) &&
    input?.["registry-url"] === "https://registry.npmjs.org" &&
    input?.["package-manager-cache"] === false &&
    validInputCount &&
    unconditional(step)
  );
}

function unconditional(step) {
  return step && step.if === undefined && step["continue-on-error"] === undefined;
}

function validPublishStep(step) {
  return (
    step?.run === "npm publish --provenance" &&
    Object.keys(step).every((key) => ["name", "run"].includes(key)) &&
    unconditional(step)
  );
}
