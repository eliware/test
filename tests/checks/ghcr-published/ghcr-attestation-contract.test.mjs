import { expect, test } from "@jest/globals";
import {
  findAttestation,
  findAttestationVerification,
  findDigestHandoff,
  findDigestInspection,
  findImagePush,
  findVersionTagDigestVerification,
  hasRecordedDigestEvidence,
  imageDetails,
} from "../../../src/checks/ghcr-published/ghcr-attestation-contract.mjs";

test("extracts and validates the exact pushed image and digest contract", () => {
  const job = { steps: [
    { id: "push", uses: "docker/build-push-action@v6", with: { push: true, tags: "ghcr.io/eliware/example:v1.2.3" } },
    { uses: "actions/attest@v4", with: { pushToRegistry: true, subjectName: "ghcr.io/eliware/example", subjectDigest: "${{ steps.push.outputs.digest }}" } },
    { run: `test "$(docker buildx imagetools inspect ghcr.io/eliware/example:v1.2.3 --format '{{.Manifest.Digest}}')" = "\${{ steps.push.outputs.digest }}"` },
    { run: "docker buildx imagetools inspect ghcr.io/eliware/example@${{ steps.push.outputs.digest }}" },
    { run: "gh attestation verify oci://ghcr.io/eliware/example@${{ steps.push.outputs.digest }} --repo ${{ github.repository }}" },
    { run: "printf 'verified ${{ steps.push.outputs.digest }}\\n' >> \"$GITHUB_STEP_SUMMARY\"" },
  ] };
  const details = imageDetails(findImagePush(job));
  expect(details).toEqual({ image: "ghcr.io/eliware/example", tag: "ghcr.io/eliware/example:v1.2.3", digestReference: "${{ steps.push.outputs.digest }}" });
  expect(findAttestation(job, details)).toBeTruthy();
  expect(findDigestInspection(job, details)).toBeTruthy();
  expect(findVersionTagDigestVerification(job, details)).toBeTruthy();
  expect(findAttestationVerification(job, details)).toBeTruthy();
  expect(hasRecordedDigestEvidence(job, details)).toBe(true);
  expect(findDigestHandoff(job, details)).toBe(job.steps[5]);
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

test("rejects conditional or continue-on-error evidence and handles incomplete steps", () => {
  const push = { id: "push", uses: "docker/build-push-action@v6", with: { push: true, tags: "ghcr.io/eliware/example:v1.2.3" } };
  const details = imageDetails(push);
  expect(findImagePush({ steps: [{ ...push, if: "always()" }] })).toBeUndefined();
  expect(findImagePush({ steps: [{ ...push, "continue-on-error": true }] })).toBeUndefined();
  expect(findImagePush({ steps: [{ ...push, continueOnError: true }] })).toBeUndefined();
  expect(findAttestation({ steps: [null, { uses: "actions/attest@v4" }] }, details)).toBeUndefined();
  expect(findDigestHandoff({ steps: [{ if: "always()", run: "echo release-handoff ${{ steps.push.outputs.digest }}" }] }, details))
    .toBeUndefined();
  expect(findDigestHandoff({ steps: [{ run: "echo nothing" }] }, details)).toBeUndefined();
});
