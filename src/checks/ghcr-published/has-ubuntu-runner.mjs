import { normalizeWorkflowJob } from "./normalize-workflow-document.mjs";

export function hasUbuntuRunner(workflow, job) {
  const runner = normalizeWorkflowJob(job)?.["runs-on"];
  return /ubuntu(?:-latest|-\d{2}\.\d{2})?/iu.test(String(runner ?? ""));
}
