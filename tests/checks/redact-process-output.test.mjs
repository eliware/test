import { expect, test } from "@jest/globals";
import { redactProcessOutput } from "../../src/checks/redact-process-output.mjs";

test("redacts structured, quoted, and authorization credentials", () => {
  expect(redactProcessOutput('password: "secret value" token=abc12345')).toBe(
    "password: [REDACTED] token=[REDACTED]",
  );
  expect(redactProcessOutput("Authorization: Bearer abcdefghijkl")).toBe(
    "Authorization: Bearer [REDACTED]",
  );
});
