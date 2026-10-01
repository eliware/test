import { expect, test } from "@jest/globals";
import {
  findDigestHandoff,
  hasRecordedDigestEvidence,
} from "../../../src/checks/ghcr-published/find-ghcr-digest-handoff.mjs";

const details = { digestReference: "${{ steps.publish.outputs.digest }}" };

test("requires the digest reference to be appended to the workflow summary", () => {
  const handoff = { run: `echo verified ${details.digestReference} >> "$GITHUB_STEP_SUMMARY"` };
  expect(hasRecordedDigestEvidence({ steps: [handoff] }, details)).toBe(true);
  expect(findDigestHandoff({ steps: [{ if: "always()", ...handoff }, handoff] }, details)).toBe(
    handoff,
  );
  expect(findDigestHandoff({}, details)).toBeUndefined();
});

test("rejects unrelated, conditional, or digest-free records", () => {
  expect(hasRecordedDigestEvidence({ steps: [{ run: "echo release-handoff" }] }, details)).toBe(
    false,
  );
  expect(findDigestHandoff({ steps: [{ run: "echo nothing" }] }, details)).toBeUndefined();
  expect(hasRecordedDigestEvidence({ steps: [{ run: 42 }] }, details)).toBe(false);
});

test.each([
  `echo release-handoff ${details.digestReference}`,
  `echo ${details.digestReference} ${details.digestReference} >> "$GITHUB_STEP_SUMMARY"`,
  `echo ${details.digestReference}` + ` >> "$GITHUB_STEP_SUMMARY"; echo done`,
  `echo $(cat ${details.digestReference}) >> "$GITHUB_STEP_SUMMARY"`,
])("rejects digest mentions that do not safely record evidence: %s", (run) => {
  expect(hasRecordedDigestEvidence({ steps: [{ run }] }, details)).toBe(false);
});
