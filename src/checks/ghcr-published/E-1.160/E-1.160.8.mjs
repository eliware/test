import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import {
  findAttestation,
  findAttestationVerification,
  findDigestHandoff,
  findDigestInspection,
  findImagePush,
  findVersionTagDigestVerification,
  imageDetails,
} from "../ghcr-attestation-contract.mjs";
import { steps } from "../workflow-structure.mjs";

export const ruleId = "E-1.160.8";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publications = (await readWorkflows(root)).filter(isPublicationWorkflow);
    const verified = publications.some((publication) => publicationJobs(publication).some(({ job }) => {
      const push = findImagePush(job);
      const details = imageDetails(push);
      const attestation = details.image && findAttestation(job, details);
      const inspection = details.image && findDigestInspection(job, details);
      const tagVerification = details.image && findVersionTagDigestVerification(job, details);
      const attestationVerification = details.image && findAttestationVerification(job, details);
      const handoff = details.image && findDigestHandoff(job, details);
      const orderedSteps = [push, attestation, tagVerification, inspection, attestationVerification, handoff];
      const indices = orderedSteps.map((step) => step ? steps(job).indexOf(step) : -1);
      return details.image && orderedSteps.every(Boolean) && indices.every((index, position) =>
        index >= 0 && (position === 0 || index > indices[position - 1]),
      );
    }));
    if (publications.length === 0 || !verified)
      return fail(ruleId, "GHCR publication must expose and verify the pushed image digest.");
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
