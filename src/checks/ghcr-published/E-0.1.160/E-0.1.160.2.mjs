import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { hasExactTagTrigger } from "../has-exact-tag-trigger.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { steps } from "../workflow-structure.mjs";
import { findImagePush } from "../find-ghcr-image-push.mjs";
import { hasReleaseTagGuard, isTagRelease, tagMatchesPackageVersion } from "../release-version-tag.mjs";

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
      publications.some(
        (workflow) =>
          hasExactTagTrigger(workflow) &&
          publicationJobs(workflow).every(({ job }) => {
            const jobSteps = steps(job);
            const versionCheckIndex = jobSteps.findIndex(({ run }) => hasReleaseTagGuard(run));
            const push = findImagePush(job);
            return (
              job.environment === "ghcr-publish" &&
              versionCheckIndex >= 0 &&
              jobSteps.indexOf(push) > versionCheckIndex
            );
          }),
      );
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
