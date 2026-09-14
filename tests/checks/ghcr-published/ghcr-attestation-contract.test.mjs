import { expect, test } from "@jest/globals";
import { findAttestation, findDigestInspection, findImagePush, hasRecordedDigestEvidence, imageDetails } from "../../../src/checks/ghcr-published/ghcr-attestation-contract.mjs";

test("extracts and validates the exact pushed image and digest contract", () => {
  const job = { steps: [
    { id: "push", uses: "docker/build-push-action@v6", with: { push: true, tags: "ghcr.io/eliware/example:v1.2.3" } },
    { uses: "actions/attest@v4", with: { pushToRegistry: true, subjectName: "ghcr.io/eliware/example", subjectDigest: "steps.push.outputs.digest" } },
    { run: "docker buildx imagetools inspect ghcr.io/eliware/example@steps.push.outputs.digest" },
    { run: "printf 'verified steps.push.outputs.digest\\n' >> \"$GITHUB_STEP_SUMMARY\"" },
  ] };
  const details = imageDetails(findImagePush(job));
  expect(details).toEqual({ image: "ghcr.io/eliware/example", digestReference: "steps.push.outputs.digest" });
  expect(findAttestation(job, details)).toBeTruthy();
  expect(findDigestInspection(job, details)).toBeTruthy();
  expect(hasRecordedDigestEvidence(job, details)).toBe(true);
});

test("rejects latest, mismatched subjects, and broad verification commands", () => {
  const job = { steps: [
    { id: "push", uses: "docker/build-push-action@v6", with: { push: true, tags: "ghcr.io/eliware/example:latest" } },
    { uses: "actions/attest@v4", with: { pushToRegistry: true, subjectName: "ghcr.io/other/example", subjectDigest: "digest" } },
  ] };
  const details = imageDetails(findImagePush(job));
  expect(details.image).toBeNull();
  expect(findImagePush(job)).toBeUndefined();
});
