import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { permissions } from "../workflow-policy.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { steps } from "../workflow-structure.mjs";
import { findAttestation } from "../find-ghcr-attestation.mjs";
import { findImagePush, imageDetails } from "../find-ghcr-image-push.mjs";

export const ruleId = "E-1.160.5";
export const parentRuleId = "E-1.160";

export async function run({ root }) {
  try {
    const publication = (await readWorkflows(root)).find(isPublicationWorkflow);
    const publicationJob = publication && publicationJobs(publication)[0]?.job;
    const jobSteps = publicationJob ? steps(publicationJob) : [];
    const push = findImagePush(publicationJob);
    const details = imageDetails(push);
    const pushIndex = push ? jobSteps.indexOf(push) : -1;
    const attest = findAttestation(publicationJob, details);
    const attestIndex = attest ? jobSteps.indexOf(attest) : -1;
    const permissionsSet = permissions(publication, publicationJob);
    const attestWith = attest?.with ?? {};
    const subjectName = attestWith.subjectName;
    const subjectDigest = attestWith.subjectDigest;
    if (
      !publication ||
      attestIndex < 0 ||
      pushIndex < 0 ||
      attestIndex <= pushIndex ||
      permissionsSet["id-token"] !== "write" ||
      permissionsSet.attestations !== "write" ||
      permissionsSet["artifact-metadata"] !== "write" ||
      permissionsSet.contents !== "read" ||
      permissionsSet.packages !== "write" ||
      attestWith.pushToRegistry !== true ||
      subjectName !== details.image ||
      subjectDigest !== details.digestReference
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
