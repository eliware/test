import { expect, test } from "@jest/globals";
import { redactStreamOutput } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/redact-output.mjs";

test("replaces matched secrets before applying process-output redaction", () => {
  expect(redactStreamOutput("secret password=hidden", new Map([[0, 6]]))).toBe(
    "[REDACTED] password=[REDACTED]",
  );
});

test("preserves text when there are no secret matches", () => {
  expect(redactStreamOutput("safe output", [])).toBe("safe output");
});
