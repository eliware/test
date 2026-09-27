import { findAttestation } from "./find-ghcr-attestation.mjs";
import { findImagePushes, imageDetails } from "./find-ghcr-image-push.mjs";
import { permissions } from "./workflow-permissions.mjs";
import { steps } from "./workflow-structure.mjs";

const requiredPermissions = {
  "id-token": "write",
  attestations: "write",
  "artifact-metadata": "write",
  contents: "read",
  packages: "write",
};

export function hasRequiredImageAttestations(workflow, job) {
  const granted = permissions(workflow, job);
  if (Object.entries(requiredPermissions).some(([name, value]) => granted[name] !== value))
    return false;
  const jobSteps = steps(job);
  const pushes = findImagePushes(job);
  return (
    pushes.length > 0 &&
    pushes.every((push) => {
      const details = imageDetails(push);
      if (!details.image || !details.digestReference) return false;
      const pushIndex = jobSteps.indexOf(push);
      const afterPush = { ...job, steps: jobSteps.slice(pushIndex + 1) };
      return Boolean(findAttestation(afterPush, details));
    })
  );
}
