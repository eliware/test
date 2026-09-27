import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { steps } from "../workflow-structure.mjs";
import { findImagePush, imageDetails, imageTags } from "../find-ghcr-image-push.mjs";
import { readRepositoryText } from "../../read-repository-text.mjs";
import { join } from "node:path";
import { hasDocumentedLatestAlias } from "../has-documented-latest-alias.mjs";

export const ruleId = "E-0.1.160.7";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root } = context;
  try {
    const publications = (await readWorkflows(root, context)).filter(isPublicationWorkflow);
    const published = publications.some((publication) =>
      publicationJobs(publication).some(({ job }) => {
        const push = findImagePush(job);
        const details = imageDetails(push);
        return Boolean(push && details.image && details.digestReference);
      }),
    );
    const usesLatest = publications.some((publication) =>
      publicationJobs(publication).some(({ job }) =>
        steps(job).some(
          (step) =>
            step?.uses === "docker/build-push-action@v6" &&
            imageTags(step?.with?.tags).some((tag) => /:latest$/iu.test(tag)),
        ),
      ),
    );
    const latestDocumented =
      !usesLatest ||
      hasDocumentedLatestAlias(await readRepositoryText(context, join(root, "README.md")));
    if (publications.length === 0 || !published || !latestDocumented)
      return fail(
        ruleId,
        "GHCR release identity must use an exact version tag and recorded digest, not latest.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
