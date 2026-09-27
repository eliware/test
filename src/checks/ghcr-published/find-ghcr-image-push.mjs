import { steps } from "./workflow-structure.mjs";

function requiredStep(step) {
  return (
    Boolean(step) &&
    step.if === undefined &&
    step["continue-on-error"] !== true &&
    step.continueOnError !== true
  );
}

export function findImagePush(job) {
  return findImagePushes(job)[0];
}

export function findImagePushes(job) {
  return steps(job).filter(
    (step) =>
      requiredStep(step) &&
      step?.uses === "docker/build-push-action@v6" &&
      step?.with?.push === true &&
      imageTags(step?.with?.tags).some((tag) =>
        /^ghcr\.io\/[\w.-]+\/[\w.-]+:v\d+\.\d+\.\d+$/u.test(tag),
      ),
  );
}

export function imageDetails(push) {
  const tag = imageTags(push?.with?.tags).find((value) =>
    /^ghcr\.io\/[\w.-]+\/[\w.-]+:v\d+\.\d+\.\d+$/u.test(value),
  );
  const match = tag?.match(/^(.*):v\d+\.\d+\.\d+$/u) ?? null;
  const id = typeof push?.id === "string" && /^[A-Za-z_][\w-]*$/u.test(push.id) ? push.id : null;
  return {
    image: match?.[1] ?? null,
    tag: match?.[0] ?? null,
    digestReference: id ? `\${{ steps.${id}.outputs.digest }}` : null,
  };
}

export function imageTags(value) {
  return typeof value === "string"
    ? value
        .split(/\r?\n/u)
        .map((tag) => tag.trim())
        .filter(Boolean)
    : [];
}
