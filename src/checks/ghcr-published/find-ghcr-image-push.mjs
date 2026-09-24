import { steps } from "./workflow-structure.mjs";

function requiredStep(step) {
  return Boolean(step) && step.if === undefined && step["continue-on-error"] !== true && step.continueOnError !== true;
}

export function findImagePush(job) {
  return steps(job).find((step) =>
    requiredStep(step) && step?.uses === "docker/build-push-action@v6" && step?.with?.push === true &&
    typeof step?.with?.tags === "string" && /^ghcr\.io\/[\w.-]+\/[\w.-]+:v\d+\.\d+\.\d+$/u.test(step.with.tags),
  );
}

export function imageDetails(push) {
  const tag = push?.with?.tags;
  const match = typeof tag === "string" ? tag.match(/^(.*):v\d+\.\d+\.\d+$/u) : null;
  const id = typeof push?.id === "string" && /^[A-Za-z_][\w-]*$/u.test(push.id) ? push.id : null;
  return { image: match?.[1] ?? null, tag: match?.[0] ?? null, digestReference: id ? `\${{ steps.${id}.outputs.digest }}` : null };
}
