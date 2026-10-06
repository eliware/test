export function validateWorkflowSteps(steps) {
  const errors = [];
  const checkout = steps.findIndex((step) => step.uses === "actions/checkout@v6");
  const setup = steps.findIndex((step) => step.uses === "actions/setup-node@v7");
  const npmInstall = steps.findIndex((step) => step.run === "npm -g install npm@latest");
  const ci = steps.findIndex((step) => step.run === "npm ci");
  const test = steps.findIndex((step) => step.run === "npm test");
  if (
    checkout < 0 ||
    setup <= checkout ||
    setup < 0 ||
    npmInstall <= setup ||
    ci <= npmInstall ||
    test !== ci + 1 ||
    count(steps, (step) => step.uses === "actions/checkout@v6") !== 1 ||
    count(steps, (step) => step.uses === "actions/setup-node@v7") !== 1 ||
    count(steps, (step) => step.run === "npm -g install npm@latest") !== 1 ||
    count(steps, (step) => step.run === "npm ci") !== 1 ||
    count(steps, (step) => step.run === "npm test") !== 1
  )
    errors.push("ci.yaml must use checkout v6, setup-node v7, npm latest, npm ci, then npm test.");
  if (![26, "26"].includes(steps[setup]?.with?.["node-version"]))
    errors.push("ci.yaml setup-node must use Node.js 26.");
  if (steps[checkout]?.with?.repository !== undefined || steps[checkout]?.with?.ref !== undefined)
    errors.push("ci.yaml must not override the checkout repository or ref.");
  for (const step of steps.slice(0, Math.max(ci, 0)))
    if (!isApprovedPreInstallStep(step))
      errors.push("ci.yaml has an unapproved step before npm ci.");
  for (const step of steps)
    if (hasPublicationCommand(step?.run))
      errors.push("ci.yaml validation job must not include publication commands.");
  for (const step of steps)
    if (
      typeof step?.run === "string" &&
      /\bnpm\s+run\s+(?:lint|audit|format(?::check)?|pack|outdated|typecheck|build)\b/iu.test(
        step.run,
      )
    )
      errors.push("ci.yaml must not duplicate aggregate validation stages.");
  if (steps.some((step) => step?.if !== undefined || step?.["continue-on-error"] !== undefined))
    errors.push("ci.yaml validation steps must run unconditionally without continue-on-error.");
  for (const step of [steps[ci], steps[test]])
    if (step?.env || step?.shell || step?.["working-directory"])
      errors.push("npm ci and npm test steps must not override env, shell, or working-directory.");
  return errors;
}

function hasPublicationCommand(command) {
  if (typeof command !== "string") return false;
  return [
    /(?:^|(?:&&|\|\||[;&|])\s*)npm\s+(?:--[^\s]+\s+)*publish\b/iu,
    /\b(?:docker|podman|buildah)\s+push\b[^;\r\n]*\bghcr\.io\//iu,
    /\b(?:docker|podman|buildah)\s+buildx\s+build\b[^;\r\n]*--push[^;\r\n]*\bghcr\.io\//iu,
    /\b(?:oras|crane)\s+push\b[^;\r\n]*\bghcr\.io\//iu,
    /\bskopeo\s+copy\b[^;\r\n]*docker:\/\/ghcr\.io\//iu,
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
    /^(?:echo|printf)(?:\s+(?:'[^'\\$`;&|<>]*'|"[^"\\$`;&|<>]*"|[\w./:@=-]+))*$/u.test(step.run)
  );
}
