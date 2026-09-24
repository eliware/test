import { stepText, steps } from "./workflow-structure.mjs";

function requiredStep(step) {
  return Boolean(step) && step.if === undefined && step["continue-on-error"] !== true && step.continueOnError !== true;
}

export function findDigestHandoff(job, details) {
  return steps(job).find((step) => requiredStep(step) && hasRecordedDigestEvidence({ steps: [step] }, details));
}

export function hasRecordedDigestEvidence(job, details) {
  return steps(job).some((step) => {
    const command = stepText(step).trim();
    return /GITHUB_STEP_SUMMARY|release[- ]handoff/iu.test(command) && command.includes(details.digestReference);
  });
}
