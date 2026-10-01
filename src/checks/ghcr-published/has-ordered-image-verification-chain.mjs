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
  let finalVerificationIndex = -1;
  const complete = pushes.every((push, index) => {
    const pushIndex = pushIndices[index];
    const nextPushIndex = pushIndices.find((candidate) => candidate > pushIndex) ?? jobSteps.length;
    const segment = { ...job, steps: jobSteps.slice(pushIndex + 1, nextPushIndex) };
    const details = imageDetails(push);
    if (!details.digestReference) return false;
    const finders = [
      findAttestation,
      findVersionTagDigestVerification,
      findDigestInspection,
      findAttestationVerification,
      findDigestHandoff,
    ];
    let searchStart = 0;
    for (const [evidenceIndex, findEvidence] of finders.entries()) {
      const remaining = { ...segment, steps: segment.steps.slice(searchStart) };
      const evidence = findEvidence(remaining, details);
      const foundIndex = remaining.steps.indexOf(evidence);
      if (foundIndex < 0) return false;
      if (index === pushes.length - 1 && evidenceIndex === finders.length - 1)
        finalVerificationIndex = pushIndex + 1 + searchStart + foundIndex;
      searchStart += foundIndex + 1;
    }
    return true;
  });
  return complete && finalVerificationIndex === jobSteps.length - 1;
}
