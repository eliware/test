import { stepText, steps } from "./workflow-structure.mjs";

export function findImagePush(job) {
  return steps(job).find((step) =>
    requiredStep(step) &&
    step?.uses === "docker/build-push-action@v6" &&
    step?.with?.push === true &&
    typeof step?.with?.tags === "string" &&
    /^ghcr\.io\/[\w.-]+\/[\w.-]+:v\d+\.\d+\.\d+$/u.test(step.with.tags),
  );
}

export function imageDetails(push) {
  const tag = push?.with?.tags;
  const match = typeof tag === "string" ? tag.match(/^(.*):v\d+\.\d+\.\d+$/u) : null;
  const id = typeof push?.id === "string" && /^[A-Za-z_][\w-]*$/u.test(push.id) ? push.id : null;
  return {
    image: match?.[1] ?? null,
    tag: match?.[0] ?? null,
    digestReference: id ? `\${{ steps.${id}.outputs.digest }}` : null,
  };
}

function requiredStep(step) {
  return Boolean(step) && step.if === undefined && step["continue-on-error"] !== true && step.continueOnError !== true;
}

export function findAttestation(job, details) {
  return steps(job).find((step) => {
    const withValues = step?.with ?? {};
    const subjectName = withValues.subjectName;
    const subjectDigest = withValues.subjectDigest;
    return requiredStep(step) && step?.uses === "actions/attest@v4" &&
      withValues.pushToRegistry === true &&
      subjectName === details.image &&
      subjectDigest === details.digestReference;
  });
}

export function findDigestInspection(job, details) {
  const expected = `${details.image}@${details.digestReference}`;
  return steps(job).find((step) =>
    requiredStep(step) &&
    /^docker\s+buildx\s+imagetools\s+inspect\s+/iu.test(String(step?.run ?? "").trim()) &&
    String(step.run).trim() === `docker buildx imagetools inspect ${expected}`,
  );
}

export function findVersionTagDigestVerification(job, details) {
  const command = `test "$(docker buildx imagetools inspect ${details.tag} --format '{{.Manifest.Digest}}')" = "${details.digestReference}"`;
  return steps(job).find((step) => requiredStep(step) && String(step?.run ?? "").trim() === command);
}

export function findAttestationVerification(job, details) {
  const command = `gh attestation verify oci://${details.image}@${details.digestReference} --repo \${{ github.repository }}`;
  return steps(job).find((step) => requiredStep(step) && String(step?.run ?? "").trim() === command);
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
