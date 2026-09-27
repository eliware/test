import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { findImagePushes } from "../find-ghcr-image-push.mjs";
import { hasOrderedImageVerificationChain } from "../has-ordered-image-verification-chain.mjs";

export const ruleId = "E-0.1.160.8";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root } = context;
  try {
    const publications = (await readWorkflows(root, context)).filter(isPublicationWorkflow);
    const imageJobs = publications.flatMap((publication) =>
      publicationJobs(publication).filter(({ job }) => findImagePushes(job).length > 0),
    );
    if (
      imageJobs.length === 0 ||
      imageJobs.some(({ job }) => !hasOrderedImageVerificationChain(job))
    )
      return fail(ruleId, "GHCR publication must expose and verify the pushed image digest.");
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
