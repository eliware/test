import { jobs, steps } from "./workflow-structure.mjs";

export function permissions(workflow, job) {
  return job?.permissions ?? workflow.document?.permissions ?? {};
}

export function hasExactTagTrigger(workflow) {
  const trigger = workflow.document?.on ?? workflow.document?.true;
  const tags = trigger?.push?.tags;
  return Array.isArray(tags) && tags.some((tag) => tag === "v*.*.*");
}

export function validationJobs(workflow) {
  return jobs(workflow).filter(
    ({ job }) =>
      steps(job).some((step) => /\bnpm\s+ci\b/i.test(String(step.run ?? ""))) &&
      steps(job).some((step) => /\bnpm\s+test\b/i.test(String(step.run ?? ""))),
  );
}

export function hasUbuntuRunner(workflow, job) {
  const runner = job?.["runs-on"] ?? job?.runsOn;
  return /ubuntu/i.test(String(runner ?? "")) || /ubuntu-latest|ubuntu-\d{2}\.\d{2}/i.test(workflow.content);
}
