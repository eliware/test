import { expect, test } from "@jest/globals";
import { redactJestOutput } from "../../../../../../../../src/validation/stages/jest/progress/create/jest/console/redact-output.mjs";

test("returns plain captured output when no redaction is needed", () => {
  expect(redactJestOutput({ stdout: ["plain"], stderr: [] }, "plain", [])).toEqual({
    captured: "plain",
    safeCaptured: "plain",
    redacted: false,
    redactionKinds: [],
  });
});

test("redacts secrets in captured output and reports their kind", () => {
  expect(redactJestOutput({ stdout: ["secret"], stderr: [] }, "secret", ["secret"])).toEqual({
    captured: "secret",
    safeCaptured: "[REDACTED]",
    redacted: true,
    redactionKinds: ["environment secret"],
  });
});

test("detects redaction in a stream when interleaved output changes the joined text", () => {
  const result = redactJestOutput({ stdout: ["abc"], stderr: ["X"] }, "abXc", ["abc"]);
  expect(result.redacted).toBe(true);
  expect(result.redactionKinds).toEqual([]);
});
