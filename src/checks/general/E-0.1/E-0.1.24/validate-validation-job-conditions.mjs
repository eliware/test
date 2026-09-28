export function validateValidationJobConditions(install, test, job) {
  if (job.if !== undefined || job["continue-on-error"] === true || job.continueOnError === true) {
    return "must not conditionally skip or ignore failure of its validation job.";
  }
  if (
    [install, test].some(
      ({ step }) =>
        step?.if !== undefined ||
        step?.["continue-on-error"] === true ||
        step?.continueOnError === true,
    )
  ) {
    return "must not conditionally skip or ignore failure of npm ci or npm test.";
  }
  if (
    [install, test].some(({ step }) =>
      ["env", "shell", "working-directory", "with"].some((field) => step?.[field] !== undefined),
    )
  ) {
    return "must not override npm ci or npm test step environment, shell, or working directory.";
  }
  return null;
}
