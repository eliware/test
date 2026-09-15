import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { steps } from "../workflow-structure.mjs";
import { findImagePush, imageDetails } from "../ghcr-attestation-contract.mjs";

export const ruleId = "E-1.160.7";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publications = (await readWorkflows(root)).filter(isPublicationWorkflow);
    const published = publications.some((publication) => publicationJobs(publication).some(({ job }) => {
      const push = findImagePush(job);
      const details = imageDetails(push);
      return Boolean(push && details.image && details.digestReference);
    }));
    if (
      publications.length === 0 ||
      !published ||
      publications.some((publication) => publicationJobs(publication).some(({ job }) => steps(job).some((step) =>
        typeof step?.with?.tags === "string" && /:latest\b/iu.test(step.with.tags),
      )))
    )
      return fail(
        ruleId,
        "GHCR release identity must use an exact version tag and recorded digest, not latest.",
      );
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
