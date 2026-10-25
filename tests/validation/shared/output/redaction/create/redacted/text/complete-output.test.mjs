import { expect, test } from "@jest/globals";
import { createRedactedStreamPolicy } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/policy.mjs";
import { createCompleteOutputRedactor } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/text/complete-output.mjs";

test("creates a complete-output redactor from the stream policy", () => {
  const policy = createRedactedStreamPolicy(["opaque-secret"], 100);
  const redactComplete = createCompleteOutputRedactor(policy);

  expect(redactComplete("progress opaque-secret done")).toBe("progress [REDACTED] done");
});
