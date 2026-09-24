import { expect, test } from "@jest/globals";
import { findAttestation, findAttestationVerification } from "../../../src/checks/ghcr-published/find-ghcr-attestation.mjs";

const details = { image: "ghcr.io/eliware/example", digestReference: "${{ steps.publish.outputs.digest }}" };

test("matches an unconditional attestation to the pushed image and digest", () => {
  const match = { uses: "actions/attest@v4", with: { pushToRegistry: true, subjectName: details.image, subjectDigest: details.digestReference } };
  expect(findAttestation({ steps: [null, { ...match, continueOnError: true }, match] }, details)).toBe(match);
  expect(findAttestation({}, details)).toBeUndefined();
});

test("rejects mismatched subjects and detects the exact attestation verification command", () => {
  expect(findAttestation({ steps: [{ uses: "actions/attest@v4", with: { ...details, pushToRegistry: true, subjectName: "ghcr.io/other/image" } }] }, details)).toBeUndefined();
  const run = `gh attestation verify oci://${details.image}@${details.digestReference} --repo ` + "${{ github.repository }}";
  expect(findAttestationVerification({ steps: [{ run: ` ${run} ` }] }, details).run.trim()).toBe(run);
  expect(findAttestationVerification({ steps: [{}, { run: "unrelated command" }] }, details)).toBeUndefined();
  expect(findAttestationVerification({}, details)).toBeUndefined();
});
