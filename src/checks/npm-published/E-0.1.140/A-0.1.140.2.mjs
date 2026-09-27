import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../../ghcr-published/read-workflows.mjs";
import { hasExactTagTrigger } from "../../ghcr-published/has-exact-tag-trigger.mjs";
import { hasUbuntuRunner } from "../../ghcr-published/has-ubuntu-runner.mjs";
import { npmPublicationJobs } from "../npm-publication-jobs.mjs";
import { steps } from "../../ghcr-published/workflow-structure.mjs";
import { findValidationJobs } from "../../ghcr-published/find-validation-jobs.mjs";
import { hasReleaseTagGuard, isTagRelease, tagMatchesPackageVersion } from "../../ghcr-published/release-version-tag.mjs";

export const ruleId = "A-0.1.140.2";
export const parentRuleId = "E-0.1.140";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

function publishStepIsUnconditionalAndFailClosed(step) {
  const continueOnError = step["continue-on-error"] ?? step.continueOnError;
  const allowsContinueOnError = continueOnError !== undefined &&
    continueOnError !== false && String(continueOnError).trim().toLowerCase() !== "false";
  return !Object.hasOwn(step, "if") && !allowsContinueOnError;
}

export async function run(context) {
  const { root, packageJson } = context;
  const env = context.env ?? process.env;
  let workflows;
  try {
    workflows = await readWorkflows(root, context);
  } catch (error) {
    return fail(ruleId, `npm publication workflows could not be read: ${error.message}`);
  }
  if (!workflows.some((workflow) => npmPublicationJobs(workflow).length > 0)) return fail(ruleId, "npm-published repositories must define a publication workflow.");
  for (const workflow of workflows) {
    const publication = npmPublicationJobs(workflow);
    if (publication.length === 0) {
      if (/\bnpm\s+publish\b/i.test(workflow.content)) {
        return fail(ruleId, `Publication workflow could not be parsed: ${workflow.name}.`);
      }
      continue;
    }
    const version = packageJson?.version;
    const verifiedVersion = typeof version === "string" &&
      (!isTagRelease(env) || tagMatchesPackageVersion(env.GITHUB_REF_NAME, version)) &&
      publication.every(({ job }) => {
      const jobSteps = steps(job);
      const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
      const hasValidationDependency = findValidationJobs(workflow).some(({ id, job: validationJob }) =>
        hasUbuntuRunner(workflow, validationJob) && needs.includes(id),
      );
      const verifyIndex = jobSteps.findIndex(({ run }) => hasReleaseTagGuard(run));
      const publishIndex = jobSteps.findIndex(({ run }) => /^npm\s+publish\b/iu.test(String(run).trim()));
      return verifyIndex >= 0 && publishIndex > verifyIndex &&
        hasValidationDependency &&
        publishStepIsUnconditionalAndFailClosed(jobSteps[publishIndex]) &&
        hasUbuntuRunner(workflow, job);
    });
    if (
      !hasExactTagTrigger(workflow) ||
      typeof version !== "string" ||
      !verifiedVersion
    ) {
      return fail(
        ruleId,
        `Publication workflow must use exact version tags, verify package version, and validate on Ubuntu: ${workflow.name}.`,
      );
    }
  }
  return pass(ruleId);
}
