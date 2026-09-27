import { steps } from "../../ghcr-published/workflow-structure.mjs";

const setupNodeAction = /^actions\/setup-node@v7(?:\.\d+(?:\.\d+)?)?$/iu;

export function validateNpmOidcPublishSetup(job) {
  const setupSteps = steps(job).filter((step) => setupNodeAction.test(String(step?.uses ?? "")));
  if (setupSteps.length !== 1)
    return "The npm publication job must use actions/setup-node@v7 exactly once.";
  const options = setupSteps[0].with ?? {};
  if (String(options["node-version"] ?? "") !== "26")
    return "The npm publication job must use Node.js 26.";
  if (options["registry-url"] !== "https://registry.npmjs.org")
    return "The npm publication job must configure the public npm registry.";
  if (options["package-manager-cache"] !== false)
    return "The npm publication job must disable package-manager caching.";
  return null;
}
