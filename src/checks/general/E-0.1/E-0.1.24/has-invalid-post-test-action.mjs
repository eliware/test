export function hasInvalidPostTestAction(steps, testIndex, allowAttestation) {
  return steps.some((step, index) => {
    const approved = allowAttestation && isApprovedAttestation(step);
    return (
      index > testIndex &&
      typeof step?.uses === "string" &&
      (!approved || step["continue-on-error"] === true || step.continueOnError === true)
    );
  });
}

function isApprovedAttestation(step) {
  // codescope ignore: this generic step-shape check permits GHCR attestations; GHCR chain validation matches subjectName and subjectDigest to the pushed image and output
  if (step?.uses !== "actions/attest@v4" || !step.with || typeof step.with !== "object")
    return false;
  const subjectName = step.with.subjectName ?? step.with["subject-name"];
  const subjectDigest = step.with.subjectDigest ?? step.with["subject-digest"];
  const pushToRegistry = step.with.pushToRegistry ?? step.with["push-to-registry"];
  return (
    typeof subjectName === "string" &&
    subjectName.length > 0 &&
    typeof subjectDigest === "string" &&
    subjectDigest.length > 0 &&
    pushToRegistry === true
  );
}
