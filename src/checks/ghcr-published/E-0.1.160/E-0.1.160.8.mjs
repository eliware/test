import { fail, pass } from "../../check-result.mjs";
import { readWorkflows } from "../read-workflows.mjs";
import { isPublicationWorkflow, publicationJobs } from "../workflow-publication.mjs";
import { findAttestation, findAttestationVerification } from "../find-ghcr-attestation.mjs";
import { findDigestHandoff } from "../find-ghcr-digest-handoff.mjs";
import {
  findDigestInspection,
  findVersionTagDigestVerification,
} from "../find-ghcr-digest-verification.mjs";
import { findImagePushes, imageDetails } from "../find-ghcr-image-push.mjs";
import { steps } from "../workflow-structure.mjs";

export const ruleId = "E-0.1.160.8";
export const parentRuleId = "E-0.1.160";
export const repositoryInventoryOptions = { expandedDirectories: [".github"] };

function hasOrderedVerificationChain(job) {
  const jobSteps = steps(job);
  const pushes = findImagePushes(job);
  return pushes.some((push) => {
    const pushIndex = jobSteps.indexOf(push);
    const nextPushIndex =
      pushes.map((candidate) => jobSteps.indexOf(candidate)).find((index) => index > pushIndex) ??
      jobSteps.length;
    const segment = { ...job, steps: jobSteps.slice(pushIndex + 1, nextPushIndex) };
    const details = imageDetails(push);
    if (!details.image || !details.digestReference) return false;
    const verificationSteps = [
      findAttestation(segment, details),
      findVersionTagDigestVerification(segment, details),
      findDigestInspection(segment, details),
      findAttestationVerification(segment, details),
      findDigestHandoff(segment, details),
    ];
    const verificationIndices = verificationSteps.map((step) => segment.steps.indexOf(step));
    return (
      verificationSteps.every(Boolean) &&
      verificationIndices.every(
        (index, position) =>
          index >= 0 && (position === 0 || index > verificationIndices[position - 1]),
      )
    );
  });
}

export async function run(context) {
  const { root } = context;
  try {
    const publications = (await readWorkflows(root, context)).filter(isPublicationWorkflow);
    const verified = publications.some((publication) =>
      publicationJobs(publication).some(({ job }) => hasOrderedVerificationChain(job)),
    );
    if (publications.length === 0 || !verified)
      return fail(ruleId, "GHCR publication must expose and verify the pushed image digest.");
  } catch (error) {
    return fail(ruleId, `GHCR workflows could not be inspected: ${error.message}`);
  }
  return pass(ruleId);
}
