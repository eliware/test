import { findValidationJobs } from "./find-validation-jobs.mjs";
import { hasUbuntuRunner } from "../has-ubuntu-runner.mjs";

export function dependsOnUbuntuValidation(
  workflow,
  publicationJob,
  validationJobs = findValidationJobs(workflow),
) {
  const needs = Array.isArray(publicationJob.needs)
    ? publicationJob.needs
    : publicationJob.needs
      ? [publicationJob.needs]
      : [];
  return validationJobs.some(({ id, job }) => hasUbuntuRunner(job) && needs.includes(id));
}
