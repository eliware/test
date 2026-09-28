import { jobs, stepText, steps, stepsForWorkflow } from "./workflow-structure.mjs";

export function isPublicationWorkflow(workflow, pattern) {
  if (pattern instanceof RegExp)
    return stepsForWorkflow(workflow).some((step) => pattern.test(stepText(step)));
  if (pattern !== undefined) pattern = /docker|ghcr\.io/i;
  if (pattern) return stepsForWorkflow(workflow).some((step) => pattern.test(stepText(step)));
  return publicationJobs(workflow).length > 0;
}

export function publicationJobs(workflow) {
  return jobs(workflow).filter(({ job }) =>
    steps(job).some((step) =>
      /docker\/build-push-action|docker\s+(?:build|push)|ghcr\.io|npm\s+publish/i.test(
        stepText(step),
      ),
    ),
  );
}
