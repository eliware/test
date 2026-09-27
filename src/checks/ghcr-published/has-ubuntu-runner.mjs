import { normalizeWorkflowJob } from "./normalize-workflow-document.mjs";

export function hasUbuntuRunner(workflow, job) {
  const runner = normalizeWorkflowJob(job)?.["runs-on"];
  const isUbuntuLabel = (value) => typeof value === "string" && /^ubuntu(?:-latest|-\d{2}\.\d{2})$/iu.test(value);
  return Array.isArray(runner) ? runner.some(isUbuntuLabel) : isUbuntuLabel(runner);
}
