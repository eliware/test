import { workflowJobs, workflowRunSteps } from "./read-workflows.mjs";
import { findWorkflowValidationJobs } from "./find-workflow-validation-jobs.mjs";
import { validateWorkflowSiblingJobs } from "./validate-workflow-sibling-jobs.mjs";
import { validateWorkflowValidationJobs } from "./validate-workflow-validation-jobs.mjs";

export function selectWorkflowValidationJobs(
  name,
  document,
  { publicationJobIds = new Set() } = {},
) {
  const jobs = workflowJobs(document);
  const validationJobs = findWorkflowValidationJobs(document);
  const publicationWorkflow = publicationJobIds.size > 0;
  if (publicationWorkflow && validationJobs.length === 0) {
    return {
      error: `${name} publication workflow must contain a separate validation job.`,
      jobs: [],
    };
  }
  if (validationJobs.length === 0) {
    return { error: `${name} must validate with npm ci followed by npm test.`, jobs: [] };
  }
  const validationError = validateWorkflowValidationJobs(name, validationJobs);
  if (validationError) return { error: validationError, jobs: [] };
  const validationJobIds = new Set(validationJobs.map(({ id }) => id));
  const siblingError = validateWorkflowSiblingJobs(
    name,
    jobs.map(({ id, job }) => ({ id, job, commands: workflowRunSteps(job) })),
    validationJobIds,
    publicationJobIds,
  );
  if (siblingError) return { error: siblingError, jobs: [] };
  return { error: null, jobs: validationJobs };
}
