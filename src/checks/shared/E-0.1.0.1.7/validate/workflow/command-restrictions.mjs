import { isProhibitedNpmOrGhcrPublishCommand } from "../../../is-prohibited-npm-or-ghcr-publish-command.mjs";
import { readCanonicalOrder } from "../../../../../validation/shared/conventions/read-canonical-order.mjs";

export function validateWorkflowCommandRestrictions(steps) {
  const { validationSteps, stepValues } = readCanonicalOrder("ci-workflow.yaml");
  const indexes = validationSteps.map((name, index) =>
    steps.findIndex((step) => (index < 2 ? step.uses : step.run) === stepValues[name]),
  );
  const [checkout, setup, npmInstall, ci, test] = indexes;
  const errors = [];
  if (![26, "26"].includes(steps[setup]?.with?.["node-version"]))
    errors.push("ci.yaml setup-node must use Node.js 26.");
  const setupInputs = steps[setup]?.with ?? {};
  if (
    Object.keys(setupInputs).some((key) => !["node-version", "cache"].includes(key)) ||
    setupInputs.cache !== "npm"
  )
    errors.push("ci.yaml setup-node may use only node-version 26 and npm cache inputs.");
  const checkoutOptions = steps[checkout]?.with ?? {};
  if (
    ["repository", "ref", "sparse-checkout", "sparse-checkout-cone-mode"].some(
      (key) => checkoutOptions[key] !== undefined,
    )
  )
    errors.push("ci.yaml must not override the checkout repository, ref, or sparse scope.");
  for (const step of steps.slice(0, Math.max(ci, 0)))
    if (!isApprovedPreInstallStep(step))
      errors.push("ci.yaml has an unapproved step before npm ci.");
  for (const step of steps)
    if (isProhibitedNpmOrGhcrPublishCommand(step?.run))
      errors.push("ci.yaml validation job must not publish npm packages or GHCR images.");
  if (
    steps
      .slice(0, test + 1)
      .some((step) => step?.if !== undefined || step?.["continue-on-error"] !== undefined)
  )
    errors.push(
      "ci.yaml required validation steps must run unconditionally without continue-on-error.",
    );
  for (const step of [steps[npmInstall], steps[ci], steps[test]])
    if (["env", "shell", "working-directory"].some((key) => Object.hasOwn(step ?? {}, key)))
      errors.push(
        "npm install, npm ci, and npm test steps must not override env, shell, or working-directory.",
      );
  return errors;
}

function isApprovedPreInstallStep(step) {
  if (step?.uses === "actions/checkout@v6" || step?.uses === "actions/setup-node@v7")
    return step.run === undefined;
  if (step?.run === "npm -g install npm@latest") return step.uses === undefined;
  return (
    typeof step?.run === "string" &&
    step.uses === undefined &&
    !/[\r\n]/u.test(step.run) &&
    /^(?:echo|printf)(?:\s+(?:'[^'\\$`;&|<>]*'|"[^"\\$`;&|<>]*"|[\w./:@=-]+))*$/u.test(step.run)
  );
}
