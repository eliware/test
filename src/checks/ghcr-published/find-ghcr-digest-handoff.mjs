import { steps } from "./workflow-structure.mjs";

function requiredStep(step) {
  return (
    Boolean(step) &&
    step.if === undefined &&
    step["continue-on-error"] !== true &&
    step.continueOnError !== true
  );
}

export function findDigestHandoff(job, details) {
  return steps(job).find(
    (step) => requiredStep(step) && hasRecordedDigestEvidence({ steps: [step] }, details),
  );
}

export function hasRecordedDigestEvidence(job, details) {
  return steps(job).some((step) => {
    const command = typeof step?.run === "string" ? step.run.trim() : "";
    const match = /^echo\s+(.+?)\s+>>\s+"\$GITHUB_STEP_SUMMARY"$/u.exec(command);
    if (!match) return false;
    const value = match[1];
    const digestIndex = value.indexOf(details.digestReference);
    if (digestIndex < 0 || value.indexOf(details.digestReference, digestIndex + 1) >= 0)
      return false;
    const surroundingText =
      value.slice(0, digestIndex) + value.slice(digestIndex + details.digestReference.length);
    return !/[;<>|&`$]/u.test(surroundingText);
  });
}
