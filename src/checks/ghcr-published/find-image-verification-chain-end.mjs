import { findAttestation, findAttestationVerification } from "./find-ghcr-attestation.mjs";
import { findDigestHandoff } from "./find-ghcr-digest-handoff.mjs";
import {
  findDigestInspection,
  findVersionTagDigestVerification,
} from "./find-ghcr-digest-verification.mjs";
import { steps } from "./workflow-structure.mjs";

const evidenceFinders = [
  findAttestation,
  findVersionTagDigestVerification,
  findDigestInspection,
  findAttestationVerification,
  findDigestHandoff,
];

export function findImageVerificationChainEnd(job, details) {
  const jobSteps = steps(job);
  if (!details?.digestReference) return -1;
  let searchStart = 0;
  for (const findEvidence of evidenceFinders) {
    const remaining = { ...job, steps: jobSteps.slice(searchStart) };
    const evidence = findEvidence(remaining, details);
    const foundIndex = remaining.steps.indexOf(evidence);
    if (foundIndex < 0) return -1;
    searchStart += foundIndex + 1;
  }
  return searchStart - 1;
}
