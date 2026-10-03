import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { findImagePush, imageDetails } from "../find-ghcr-image-push.mjs";

export const ruleId = "E-0.1.160.7";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root, packageJson } = context;
  try {
    const packageName = String(packageJson?.name ?? "").replace(/^@[^/]+\//u, "");
    const expectedImage = packageName ? `ghcr.io/eliware/${packageName}` : "";
    const publications = (await readWorkflows(root, context)).filter(isPublicationWorkflow);
    const published = publications.some((publication) =>
      publicationJobs(publication).some(({ job }) => {
        const push = findImagePush(job);
        const details = imageDetails(push);
        return Boolean(
          push &&
          details.image?.toLowerCase() === expectedImage.toLowerCase() &&
          details.digestReference,
        );
      }),
    );
    if (publications.length === 0 || !published)
      return fail(
        ruleId,
        "GHCR release identity must use an exact version tag and recorded digest, not latest.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
