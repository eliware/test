import { expect, test } from "@jest/globals";
import { findDigestHandoff, hasRecordedDigestEvidence } from "../../../src/checks/ghcr-published/find-ghcr-digest-handoff.mjs";

const details = { digestReference: "${{ steps.publish.outputs.digest }}" };

test("requires the digest reference in recorded handoff or workflow summary evidence", () => {
  const handoff = { run: `echo release-handoff ${details.digestReference}` };
  expect(hasRecordedDigestEvidence({ steps: [handoff] }, details)).toBe(true);
  expect(findDigestHandoff({ steps: [{ if: "always()", ...handoff }, handoff] }, details)).toBe(handoff);
  expect(findDigestHandoff({}, details)).toBeUndefined();
});

test("rejects unrelated, conditional, or digest-free records", () => {
  expect(hasRecordedDigestEvidence({ steps: [{ run: "echo release-handoff" }] }, details)).toBe(false);
  expect(findDigestHandoff({ steps: [{ run: "echo nothing" }] }, details)).toBeUndefined();
});
