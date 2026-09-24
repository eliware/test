import { steps } from "./workflow-structure.mjs";

function requiredStep(step) {
  return Boolean(step) && step.if === undefined && step["continue-on-error"] !== true && step.continueOnError !== true;
}

export function findDigestInspection(job, details) {
  const expected = `${details.image}@${details.digestReference}`;
  return steps(job).find((step) => requiredStep(step) && /^docker\s+buildx\s+imagetools\s+inspect\s+/iu.test(String(step?.run ?? "").trim()) &&
    String(step.run).trim() === `docker buildx imagetools inspect ${expected}`);
}

export function findVersionTagDigestVerification(job, details) {
  const command = `test "$(docker buildx imagetools inspect ${details.tag} --format '{{.Manifest.Digest}}')" = "${details.digestReference}"`;
  return steps(job).find((step) => requiredStep(step) && String(step?.run ?? "").trim() === command);
}
