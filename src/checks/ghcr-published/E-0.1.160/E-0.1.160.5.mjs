import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { findImagePushes } from "../find-ghcr-image-push.mjs";
import { hasRequiredImageAttestations } from "../has-required-image-attestations.mjs";

export const ruleId = "E-0.1.160.5";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

export async function run(context) {
  const { root } = context;
  try {
    const publications = (await readWorkflows(root, context)).filter(isPublicationWorkflow);
    const publisherJobs = publications.flatMap((publication) =>
      publicationJobs(publication)
        .filter(({ job }) => findImagePushes(job).length > 0)
        .map(({ job }) => ({ publication, job })),
    );
    if (
      publisherJobs.length === 0 ||
      publisherJobs.some(({ publication, job }) => !hasRequiredImageAttestations(publication, job))
    )
      return fail(
        ruleId,
        "GHCR publication must produce a signed artifact attestation with the required permissions.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
