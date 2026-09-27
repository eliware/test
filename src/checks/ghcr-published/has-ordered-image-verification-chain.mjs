import { findAttestation, findAttestationVerification } from "./find-ghcr-attestation.mjs";
import { findDigestHandoff } from "./find-ghcr-digest-handoff.mjs";
import {
  findDigestInspection,
  findVersionTagDigestVerification,
} from "./find-ghcr-digest-verification.mjs";
import { findImagePushes, imageDetails } from "./find-ghcr-image-push.mjs";
import { steps } from "./workflow-structure.mjs";

export function hasOrderedImageVerificationChain(job) {
  const jobSteps = steps(job);
  const pushes = findImagePushes(job);
  if (pushes.length === 0) return false;
  const pushIndices = pushes.map((push) => jobSteps.indexOf(push));
  return pushes.every((push, index) => {
    const pushIndex = pushIndices[index];
    const nextPushIndex = pushIndices.find((candidate) => candidate > pushIndex) ?? jobSteps.length;
    const segment = { ...job, steps: jobSteps.slice(pushIndex + 1, nextPushIndex) };
    const details = imageDetails(push);
    if (!details.digestReference) return false;
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
        (stepIndex, position) =>
          stepIndex >= 0 && (position === 0 || stepIndex > verificationIndices[position - 1]),
      )
    );
  });
}
