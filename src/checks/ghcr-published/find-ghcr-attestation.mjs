import { steps } from "./workflow-structure.mjs";

function requiredStep(step) {
  return Boolean(step) && step.if === undefined && step["continue-on-error"] !== true && step.continueOnError !== true;
}

export function findAttestation(job, details) {
  return steps(job).find((step) => {
    const withValues = step?.with ?? {};
    return requiredStep(step) && step?.uses === "actions/attest@v4" && withValues.pushToRegistry === true &&
      withValues.subjectName === details.image && withValues.subjectDigest === details.digestReference;
  });
}

export function findAttestationVerification(job, details) {
  const command = `gh attestation verify oci://${details.image}@${details.digestReference} --repo \${{ github.repository }}`;
  return steps(job).find((step) => requiredStep(step) && String(step?.run ?? "").trim() === command);
}
