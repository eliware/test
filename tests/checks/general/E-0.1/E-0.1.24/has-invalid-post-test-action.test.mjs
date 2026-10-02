import { expect, test } from "@jest/globals";
import { hasInvalidPostTestAction } from "../../../../../src/checks/general/E-0.1/E-0.1.24/has-invalid-post-test-action.mjs";

test("rejects unapproved post-test actions", () => {
  expect(hasInvalidPostTestAction([{ uses: "actions/upload-artifact@v6" }], -1, false)).toBe(true);
  expect(hasInvalidPostTestAction([{ uses: "untrusted/action@v1" }], -1, true)).toBe(true);
});

test("allows a valid attestation only when enabled and not continue-on-error", () => {
  const attestation = {
    uses: "actions/attest@v4",
    with: {
      subjectName: "ghcr.io/eliware/example",
      subjectDigest: "${{ steps.push.outputs.digest }}",
      pushToRegistry: true,
    },
  };
  expect(hasInvalidPostTestAction([attestation], -1, true)).toBe(false);
  expect(hasInvalidPostTestAction([attestation], -1, false)).toBe(true);
  expect(hasInvalidPostTestAction([{ ...attestation, "continue-on-error": true }], -1, true)).toBe(
    true,
  );
});

test("rejects incomplete attestations", () => {
  expect(hasInvalidPostTestAction([{ uses: "actions/attest@v4", with: {} }], -1, true)).toBe(true);
});
