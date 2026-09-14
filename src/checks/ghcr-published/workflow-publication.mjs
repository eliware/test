import { jobs, stepText, steps, stepsForWorkflow } from "./workflow-structure.mjs";

export function isPublicationWorkflow(workflow, pattern = /docker|ghcr\.io/i) {
  if (!(pattern instanceof RegExp)) pattern = /docker|ghcr\.io/i;
  return stepsForWorkflow(workflow).some((step) => pattern.test(stepText(step)));
}

export function hasRun(workflow, pattern) {
  return stepsForWorkflow(workflow).some((step) => pattern.test(String(step.run ?? "")));
}

export function npmPublicationJobs(workflow) {
  return jobs(workflow).filter(({ job }) =>
    steps(job).some((step) => /\bnpm\s+publish\b/i.test(String(step.run ?? ""))),
  );
}

export function publicationJobs(workflow) {
  return jobs(workflow).filter(({ job }) =>
    steps(job).some((step) => /docker\/build-push-action|docker\s+push|npm\s+publish/i.test(stepText(step))),
  );
}
