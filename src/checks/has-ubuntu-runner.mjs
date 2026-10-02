export function hasUbuntuRunner(job) {
  const runner = job?.["runs-on"] ?? job?.runsOn;
  const isUbuntuLabel = (value) =>
    typeof value === "string" && /^ubuntu(?:-latest|-\d{2}\.\d{2})$/iu.test(value);
  return Array.isArray(runner) ? runner.some(isUbuntuLabel) : isUbuntuLabel(runner);
}
