import isSafeReportingCommand from "../is-safe-reporting-command.mjs";

export default function validateApprovedPreInstallSteps(steps, ci) {
  const errors = [];
  for (const step of steps.slice(0, Math.max(ci, 0)))
    if (!isApprovedPreInstallStep(step))
      errors.push("ci.yaml has an unapproved step before npm ci.");
  return errors;
}

function isApprovedPreInstallStep(step) {
  if (step?.uses === "actions/checkout@v7" || step?.uses === "actions/setup-node@v7")
    return step.run === undefined;
  if (step?.run === "npm -g install npm@latest") return step.uses === undefined;
  return (
    typeof step?.run === "string" &&
    step.uses === undefined &&
    !/[\r\n]/u.test(step.run) &&
    isSafeReportingCommand(step.run)
  );
}
