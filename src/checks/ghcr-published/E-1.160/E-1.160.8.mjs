import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { findAttestation, findDigestInspection, findImagePush, imageDetails, hasRecordedDigestEvidence } from "../ghcr-attestation-contract.mjs";
import { steps } from "../workflow-structure.mjs";

export const ruleId = "E-1.160.8";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publications = (await readWorkflows(root)).filter(isPublicationWorkflow);
    const verified = publications.some((publication) => publicationJobs(publication).some(({ job }) => {
      const push = findImagePush(job);
      const details = imageDetails(push);
      const pushIndex = push ? steps(job).indexOf(push) : -1;
      const attestation = details.image && findAttestation(job, details);
      const inspection = details.image && findDigestInspection(job, details);
      const inspectionIndex = inspection ? steps(job).indexOf(inspection) : -1;
      return details.image && attestation && inspection && inspectionIndex > pushIndex &&
        hasRecordedDigestEvidence(job, details);
    }));
    if (publications.length === 0 || !verified)
      return fail(ruleId, "GHCR publication must expose and verify the pushed image digest.");
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
