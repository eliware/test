import { findImagePushes, imageDetails } from "./find-ghcr-image-push.mjs";
import { findImageVerificationChainEnd } from "./find-image-verification-chain-end.mjs";
import { steps } from "./workflow-structure.mjs";

export function hasOrderedImageVerificationChain(job) {
  const jobSteps = steps(job);
  const pushes = findImagePushes(job);
  if (pushes.length === 0) return false;
  const pushIndices = pushes.map((push) => jobSteps.indexOf(push));
  let finalVerificationIndex = -1;
  const complete = pushes.every((push, index) => {
    const pushIndex = pushIndices[index];
    const nextPushIndex = pushIndices.find((candidate) => candidate > pushIndex) ?? jobSteps.length;
    const segment = { ...job, steps: jobSteps.slice(pushIndex + 1, nextPushIndex) };
    const verificationEnd = findImageVerificationChainEnd(segment, imageDetails(push));
    if (verificationEnd < 0) return false;
    if (index === pushes.length - 1) finalVerificationIndex = pushIndex + 1 + verificationEnd;
    return true;
  });
  return complete && finalVerificationIndex === jobSteps.length - 1;
}
