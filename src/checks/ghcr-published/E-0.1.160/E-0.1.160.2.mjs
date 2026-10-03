import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { hasExactTagTrigger } from "../has-exact-tag-trigger.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { isTagRelease, tagMatchesPackageVersion } from "../release-version-tag.mjs";
import { findValidationJobs } from "../find-validation-jobs.mjs";
import { dependsOnUbuntuValidation } from "../depends-on-ubuntu-validation.mjs";
import { hasVersionedImagePushAfterGuard } from "../has-versioned-image-push-after-guard.mjs";
import { validateNpmToolchainForPublication } from "../validate-npm-toolchain-for-publication.mjs";

export const ruleId = "E-0.1.160.2";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root, packageJson } = context;
  const env = context.env ?? process.env;
  const packageName = String(packageJson?.name ?? "").replace(/^@[^/]+\//u, "");
  const expectedImage = packageName ? `ghcr.io/eliware/${packageName}` : "";
  try {
    const workflows = await readWorkflows(root, context);
    // The workflow inventory check independently limits the repository to the
    // canonical publish.yaml; this check classifies every workflow with a GHCR
    // publication marker and validates every classified workflow and job.
    const publications = workflows.filter(isPublicationWorkflow);
    const validationJobsByWorkflow = new Map(
      publications.map((workflow) => [workflow, findValidationJobs(workflow)]),
    );
    const valid =
      typeof packageJson?.version === "string" &&
      Boolean(expectedImage) &&
      (!isTagRelease(env) || tagMatchesPackageVersion(env.GITHUB_REF_NAME, packageJson.version)) &&
      publications.length === 1 &&
      publications.every((workflow) => {
        const publicationJobList = publicationJobs(workflow);
        return (
          hasExactTagTrigger(workflow) &&
          publicationJobList.length > 0 &&
          publicationJobList.every(
            ({ id, job }) =>
              // codescope ignore: static workflow checks verify the environment name only; reviewer settings are external per ghcr-published.yaml.
              job.environment === "ghcr-publish" &&
              !validateNpmToolchainForPublication(`${workflow.name} job ${id}`, job) &&
              dependsOnUbuntuValidation(workflow, job, validationJobsByWorkflow.get(workflow)) &&
              hasVersionedImagePushAfterGuard(job, packageJson.version, expectedImage),
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
