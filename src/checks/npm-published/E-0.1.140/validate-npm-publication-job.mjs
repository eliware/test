import { hasUbuntuRunner } from "../../has-ubuntu-runner.mjs";
import { findValidationJobs } from "../../ghcr-published/find-validation-jobs.mjs";
import { steps } from "../../ghcr-published/workflow-structure.mjs";
import { hasReleaseTagGuard } from "../../ghcr-published/release-version-tag.mjs";
import { hasUnconditionalPublishStep } from "./has-unconditional-publish-step.mjs";
import { isApprovedNpmPublishCommand } from "./is-approved-npm-publish-command.mjs";
import { validateWorkflowPreInstallCommands } from "../../general/E-0.1/E-0.1.24/validate-workflow-pre-install-commands.mjs";

export function validateNpmPublicationJob(workflow, job) {
  const jobSteps = steps(job);
  const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
  const hasValidationDependency = findValidationJobs(workflow).some(
    ({ id, job: validationJob }) => hasUbuntuRunner(validationJob) && needs.includes(id),
  );
  const commands = jobSteps.flatMap((step, index) =>
    typeof step?.run === "string" ? [{ command: step.run.trim(), step, index }] : [],
  );
  const installCommands = commands.filter(({ command }) => /^npm\s+ci$/iu.test(command));
  const install = installCommands[0];
  const setupError = install
    ? validateWorkflowPreInstallCommands("publish job", commands, install.index, jobSteps)
    : "publish job must run npm ci after installing npm@latest.";
  const publisherRunsTest = commands.some(({ command }) => /^npm\s+test$/iu.test(command));
  const verifyIndex = jobSteps.findIndex(({ run }) => hasReleaseTagGuard(run));
  const publishIndex = jobSteps.findIndex(({ run }) => isApprovedNpmPublishCommand(run));
  return (
    verifyIndex >= 0 &&
    installCommands.length === 1 &&
    !publisherRunsTest &&
    !setupError &&
    verifyIndex > install.index &&
    publishIndex > verifyIndex &&
    hasValidationDependency &&
    hasUnconditionalPublishStep(jobSteps[publishIndex]) &&
    hasUbuntuRunner(job)
  );
}
