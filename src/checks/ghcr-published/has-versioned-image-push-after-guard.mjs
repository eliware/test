import { findImagePushes, imageDetails, imageTags } from "./find-ghcr-image-push.mjs";
import { hasReleaseTagGuard } from "./release-version-tag.mjs";
import { steps } from "./workflow-structure.mjs";

export function hasVersionedImagePushAfterGuard(job, packageVersion, expectedImage) {
  const jobSteps = steps(job);
  const versionCheckIndex = jobSteps.findIndex(
    (step) =>
      hasReleaseTagGuard(step?.run) &&
      /^[A-Za-z_][A-Za-z0-9_-]*$/u.test(step?.id ?? "") &&
      step?.if === undefined &&
      (step?.["continue-on-error"] === undefined || step?.["continue-on-error"] === false),
  );
  if (versionCheckIndex < 0) return false;

  const pushSteps = jobSteps.filter(
    (step) => step?.uses === "docker/build-push-action@v6" && step?.with?.push === true,
  );
  const pushes = findImagePushes(job);
  if (pushSteps.length !== 1 || pushes.length !== 1) return false;

  const tags = imageTags(pushes[0].with?.tags);
  const pushIndex = jobSteps.indexOf(pushes[0]);
  const actualImage = imageDetails(pushes[0]).image;
  return (
    tags.length === 1 &&
    tags[0].endsWith(`:v${packageVersion}`) &&
    (!expectedImage || actualImage?.toLowerCase() === expectedImage.toLowerCase()) &&
    pushIndex > versionCheckIndex
  );
}
