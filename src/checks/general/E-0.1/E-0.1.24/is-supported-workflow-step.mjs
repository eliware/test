const supportedFields = new Set([
  "continue-on-error",
  "env",
  "id",
  "if",
  "name",
  "run",
  "shell",
  "timeout-minutes",
  "uses",
  "with",
  "working-directory",
]);

export function isSupportedWorkflowStep(step) {
  if (!step || typeof step !== "object" || Array.isArray(step)) return false;
  const hasRun = typeof step.run === "string" && step.run.trim().length > 0;
  const hasAction = typeof step.uses === "string" && step.uses.trim().length > 0;
  return (
    hasRun !== hasAction &&
    !(hasRun && step.with !== undefined) &&
    Object.keys(step).every((field) => supportedFields.has(field))
  );
}
