import { findImagePushes, imageTags } from "./find-ghcr-image-push.mjs";
import { hasReleaseTagGuard } from "./release-version-tag.mjs";
import { steps } from "./workflow-structure.mjs";

export function hasVersionedImagePushAfterGuard(job, packageVersion) {
  const jobSteps = steps(job);
  const versionCheckIndex = jobSteps.findIndex((step) => hasReleaseTagGuard(step?.run));
  if (versionCheckIndex < 0) return false;

  const pushSteps = jobSteps.filter(
    (step) => step?.uses === "docker/build-push-action@v6" && step?.with?.push === true,
  );
  const pushes = findImagePushes(job);
  if (pushSteps.length !== 1 || pushes.length !== 1) return false;

  const tags = imageTags(pushes[0].with?.tags);
  const pushIndex = jobSteps.indexOf(pushes[0]);
  return (
    tags.length === 1 && tags[0].endsWith(`:v${packageVersion}`) && pushIndex > versionCheckIndex
  );
}
