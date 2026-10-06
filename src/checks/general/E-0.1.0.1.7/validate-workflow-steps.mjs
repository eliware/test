import { hasDuplicateAggregateStage } from "./has-duplicate-aggregate-stage.mjs";
export function validateWorkflowSteps(steps) {
  const workflowSteps = steps.map((step) => step ?? {});
  const errors = [];
  for (const step of workflowSteps) {
    const allowed =
      step?.uses === "actions/setup-node@v7"
        ? ["uses", "with"]
        : step?.uses === "actions/checkout@v6"
          ? ["uses"]
          : ["run"];
    if (Object.keys(step).some((key) => !allowed.includes(key)))
      errors.push("ci.yaml steps must use only approved keys and inputs.");
  }
  const checkout = workflowSteps.findIndex((step) => step.uses === "actions/checkout@v6");
  const setup = workflowSteps.findIndex((step) => step.uses === "actions/setup-node@v7");
  const npmInstall = workflowSteps.findIndex((step) => step.run === "npm -g install npm@latest");
  const ci = workflowSteps.findIndex((step) => step.run === "npm ci");
  const test = workflowSteps.findIndex((step) => step.run === "npm test");
  if (
    checkout < 0 ||
    setup <= checkout ||
    setup < 0 ||
    npmInstall <= setup ||
    ci <= npmInstall ||
    test !== ci + 1 ||
    count(workflowSteps, (step) => step.uses === "actions/checkout@v6") !== 1 ||
    count(workflowSteps, (step) => step.uses === "actions/setup-node@v7") !== 1 ||
    count(workflowSteps, (step) => step.run === "npm -g install npm@latest") !== 1 ||
    count(workflowSteps, (step) => step.run === "npm ci") !== 1 ||
    count(workflowSteps, (step) => step.run === "npm test") !== 1
  )
    errors.push("ci.yaml must use checkout v6, setup-node v7, npm latest, npm ci, then npm test.");
  if (test >= 0 && test !== workflowSteps.length - 1)
    errors.push("ci.yaml npm test must be the final validation-job step.");
  if (![26, "26"].includes(steps[setup]?.with?.["node-version"]))
    errors.push("ci.yaml setup-node must use Node.js 26.");
  const setupInputs = workflowSteps[setup]?.with ?? {};
  if (
    Object.keys(setupInputs).some((key) => !["node-version", "cache"].includes(key)) ||
    setupInputs.cache !== "npm"
  )
    errors.push("ci.yaml setup-node may use only node-version 26 and npm cache inputs.");
  const checkoutOptions = workflowSteps[checkout]?.with ?? {};
  if (
    checkoutOptions.repository !== undefined ||
    checkoutOptions.ref !== undefined ||
    checkoutOptions["sparse-checkout"] !== undefined ||
    checkoutOptions["sparse-checkout-cone-mode"] !== undefined
  )
    errors.push("ci.yaml must not override the checkout repository, ref, or sparse scope.");
  for (const step of workflowSteps.slice(0, Math.max(ci, 0)))
    if (!isApprovedPreInstallStep(step))
      errors.push("ci.yaml has an unapproved step before npm ci.");
  for (const step of workflowSteps)
    if (hasPublicationCommand(step?.run))
      errors.push("ci.yaml validation job must not include publication commands.");
  for (const step of workflowSteps)
    if (step?.run !== "npm test" && hasDuplicateAggregateStage(step?.run))
      errors.push("ci.yaml must not duplicate aggregate validation stages.");
  if (
    workflowSteps.some(
      (step) => step?.if !== undefined || step?.["continue-on-error"] !== undefined,
    )
  )
    errors.push("ci.yaml validation steps must run unconditionally without continue-on-error.");
  for (const step of [workflowSteps[npmInstall], workflowSteps[ci], workflowSteps[test]])
    if (["env", "shell", "working-directory"].some((key) => Object.hasOwn(step ?? {}, key)))
      errors.push(
        "npm install, npm ci, and npm test steps must not override env, shell, or working-directory.",
      );
  return errors;
}

function hasPublicationCommand(command) {
  if (typeof command !== "string") return false;
  return [
    /\b(?:semantic-release|release-it|lerna\s+publish|changesets?\s+publish)\b/iu,
    /\b(?:npm|pnpm|yarn|bun)\s+(?:(?:--?[^\s]+)(?:\s+[^-\s][^\s]*)?\s+)*(?:npm\s+)?publish\b/iu,
    /\b(?:docker|podman|buildah)\s+push\b[^;\r\n]*/iu,
    /\b(?:docker|podman|buildah)\s+(?:buildx\s+)?build\b[^;\r\n]*--push\b/iu,
    /\b(?:oras|crane)\s+push\b|\bskopeo\s+copy\b/iu,
  ].some((pattern) => pattern.test(command));
}

function count(items, predicate) {
  return items.filter(predicate).length;
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
