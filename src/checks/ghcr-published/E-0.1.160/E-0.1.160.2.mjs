import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { hasExactTagTrigger } from "../has-exact-tag-trigger.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { isTagRelease, tagMatchesPackageVersion } from "../release-version-tag.mjs";
import { findValidationJobs } from "../find-validation-jobs.mjs";
import { dependsOnUbuntuValidation } from "../depends-on-ubuntu-validation.mjs";
import { hasVersionedImagePushAfterGuard } from "../has-versioned-image-push-after-guard.mjs";

export const ruleId = "E-0.1.160.2";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root, packageJson } = context;
  const env = context.env ?? process.env;
  try {
    const workflows = await readWorkflows(root, context);
    const publications = workflows.filter(isPublicationWorkflow);
    const validationJobsByWorkflow = new Map(
      publications.map((workflow) => [workflow, findValidationJobs(workflow)]),
    );
    const valid =
      typeof packageJson?.version === "string" &&
      (!isTagRelease(env) || tagMatchesPackageVersion(env.GITHUB_REF_NAME, packageJson.version)) &&
      publications.length > 0 &&
      publications.every((workflow) => {
        const publicationJobList = publicationJobs(workflow);
        return (
          hasExactTagTrigger(workflow) &&
          publicationJobList.length > 0 &&
          publicationJobList.every(
            ({ job }) =>
              job.environment === "ghcr-publish" &&
              dependsOnUbuntuValidation(workflow, job, validationJobsByWorkflow.get(workflow)) &&
              hasVersionedImagePushAfterGuard(job, packageJson.version),
          )
        );
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
