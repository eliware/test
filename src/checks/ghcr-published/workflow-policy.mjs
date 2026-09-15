import { jobs, steps } from "./workflow-structure.mjs";

export function permissions(workflow, job) {
  return job?.permissions ?? workflow.document?.permissions ?? {};
}

export function hasExactTagTrigger(workflow) {
  const trigger = workflow.document?.on ?? workflow.document?.true;
  const tags = trigger?.push?.tags;
  return Boolean(
    trigger &&
    Object.keys(trigger).every((event) => event === "push") &&
    Array.isArray(tags) &&
    tags.length === 1 &&
    tags[0] === "v*.*.*",
  );
}

export function validationJobs(workflow) {
  return jobs(workflow).filter(
    ({ job }) =>
      steps(job).some((step) => /^npm\s+ci$/iu.test(String(step.run ?? "").trim())) &&
      steps(job).some((step) => /^npm\s+test$/iu.test(String(step.run ?? "").trim())),
  );
}

export function hasUbuntuRunner(workflow, job) {
  const runner = job?.["runs-on"] ?? job?.runsOn;
  return /ubuntu(?:-latest|-\d{2}\.\d{2})?/iu.test(String(runner ?? ""));
}
