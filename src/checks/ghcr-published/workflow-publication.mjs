import { jobs, stepText, steps, stepsForWorkflow } from "./workflow-structure.mjs";

export function isPublicationWorkflow(workflow, pattern = /docker|ghcr\.io/i) {
  if (!(pattern instanceof RegExp)) pattern = /docker|ghcr\.io/i;
  return stepsForWorkflow(workflow).some((step) => pattern.test(stepText(step)));
}

export function publicationJobs(workflow) {
  return jobs(workflow).filter(({ job }) =>
    steps(job).some((step) => /docker\/build-push-action|docker\s+(?:build|push)|npm\s+publish/i.test(stepText(step))),
  );
}
