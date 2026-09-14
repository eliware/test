import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { findDigestInspection, findImagePush, imageDetails, hasRecordedDigestEvidence } from "../ghcr-attestation-contract.mjs";

export const ruleId = "E-1.160.8";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publication = (await readWorkflows(root)).find(isPublicationWorkflow);
    const verified = publication && publicationJobs(publication).some(({ job }) => {
      const details = imageDetails(findImagePush(job));
      return details.image && findDigestInspection(job, details) && hasRecordedDigestEvidence(job, details);
    });
    if (!publication || !verified)
      return fail(ruleId, "GHCR publication must expose and verify the pushed image digest.");
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
