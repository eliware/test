import { hasUbuntuRunner } from "../../ghcr-published/has-ubuntu-runner.mjs";
import { findValidationJobs } from "../../ghcr-published/find-validation-jobs.mjs";
import { steps } from "../../ghcr-published/workflow-structure.mjs";
import { hasReleaseTagGuard } from "../../ghcr-published/release-version-tag.mjs";
import { hasUnconditionalPublishStep } from "./has-unconditional-publish-step.mjs";

export function validateNpmPublicationJob(workflow, job) {
  const jobSteps = steps(job);
  const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
  const hasValidationDependency = findValidationJobs(workflow).some(
    ({ id, job: validationJob }) => hasUbuntuRunner(workflow, validationJob) && needs.includes(id),
  );
  const verifyIndex = jobSteps.findIndex(({ run }) => hasReleaseTagGuard(run));
  const publishIndex = jobSteps.findIndex(({ run }) =>
    /^npm\s+publish\b/iu.test(String(run).trim()),
  );
  return (
    verifyIndex >= 0 &&
    publishIndex > verifyIndex &&
    hasValidationDependency &&
    hasUnconditionalPublishStep(jobSteps[publishIndex]) &&
    hasUbuntuRunner(workflow, job)
  );
}
