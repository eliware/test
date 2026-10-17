import { hasCanonicalReleaseTagGuard } from "../../../shared/publish-workflow/validate-release-tag-guard.mjs";
import { isValidNpmSetupNodeStep } from "./setup-node-step.mjs";

export function validateNpmPublishSteps(document, version) {
  const steps = document?.jobs?.publish?.steps;
  if (!Array.isArray(steps)) return ["publish.yaml publish job must define steps."];
  const errors = [];
  const setup = steps.filter(
    (step) => typeof step?.uses === "string" && step.uses.startsWith("actions/setup-node@"),
  );
  if (setup.length !== 1 || !isValidNpmSetupNodeStep(setup[0]))
    errors.push("npm publish job must use setup-node v7 with Node.js 26 and the npm registry.");
  const install = steps.findIndex((step) => step?.run === "npm -g install npm@latest");
  const ci = steps.findIndex((step) => step?.run === "npm ci");
  const publish = steps.filter(
    (step) => typeof step?.run === "string" && /\bnpm publish\b/u.test(step.run),
  );
  const publishIndex = steps.indexOf(publish[0]);
  if (!hasCanonicalReleaseTagGuard(document, steps, version, publishIndex))
    errors.push("npm publisher must guard publication with the canonical package version tag.");
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

function validPublishStep(step) {
  return (
    step?.run === "npm publish --provenance" &&
    Object.keys(step).every((key) => ["name", "run"].includes(key)) &&
    unconditional(step)
  );
}

function unconditional(step) {
  return step && step.if === undefined && step["continue-on-error"] === undefined;
}
