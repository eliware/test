export function hasUnconditionalPublishStep(step) {
  const continueOnError = step["continue-on-error"] ?? step.continueOnError;
  const allowsContinueOnError = continueOnError !== undefined &&
    continueOnError !== false && String(continueOnError).trim().toLowerCase() !== "false";
  return !Object.hasOwn(step, "if") && !allowsContinueOnError;
}
