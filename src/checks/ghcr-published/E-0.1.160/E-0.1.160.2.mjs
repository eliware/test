import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { hasExactTagTrigger } from "../has-exact-tag-trigger.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { steps } from "../workflow-structure.mjs";
import { findImagePushes, imageTags } from "../find-ghcr-image-push.mjs";
import { hasReleaseTagGuard, isTagRelease, tagMatchesPackageVersion } from "../release-version-tag.mjs";
import { findValidationJobs } from "../find-validation-jobs.mjs";
import { hasUbuntuRunner } from "../has-ubuntu-runner.mjs";

export const ruleId = "E-0.1.160.2";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root, packageJson } = context;
  const env = context.env ?? process.env;
  try {
    const workflows = await readWorkflows(root, context);
    const publications = workflows.filter(isPublicationWorkflow);
    const valid =
      typeof packageJson?.version === "string" &&
      (!isTagRelease(env) || tagMatchesPackageVersion(env.GITHUB_REF_NAME, packageJson.version)) &&
      publications.some((workflow) => {
        const publicationJobList = publicationJobs(workflow);
        return hasExactTagTrigger(workflow) && publicationJobList.length > 0 &&
          publicationJobList.every(({ job }) => {
            const validationJobs = findValidationJobs(workflow);
            const needs = Array.isArray(job.needs) ? job.needs : job.needs ? [job.needs] : [];
            const dependsOnUbuntuValidation = validationJobs.some(({ id, job: validationJob }) =>
              hasUbuntuRunner(workflow, validationJob) && needs.includes(id),
            );
            const jobSteps = steps(job);
            const versionCheckIndex = jobSteps.findIndex(({ run }) => hasReleaseTagGuard(run));
            const pushes = findImagePushes(job);
            const pushSteps = jobSteps.filter((step) => step?.uses === "docker/build-push-action@v6" && step?.with?.push === true);
            const exactPush = pushSteps.length === 1 && pushes.length === 1 && imageTags(pushes[0].with?.tags).length === 1 &&
              imageTags(pushes[0].with?.tags)[0].endsWith(`:v${packageJson.version}`);
            return (
              job.environment === "ghcr-publish" &&
              dependsOnUbuntuValidation &&
              versionCheckIndex >= 0 &&
              exactPush &&
              jobSteps.indexOf(pushes[0]) > versionCheckIndex
            );
          });
      });
    if (!valid)
      return fail(
        ruleId,
        "GHCR publication must verify package version and use the protected ghcr-publish environment before pushing.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
