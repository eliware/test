import { expect, test } from "@jest/globals";
import { redactProcessOutput } from "../../src/checks/redact-process-output.mjs";

test("redacts structured, quoted, and authorization credentials", () => {
  expect(redactProcessOutput('password: "secret value" token=abc12345')).toBe(
    "password: [REDACTED] token=[REDACTED]",
  );
  expect(redactProcessOutput("Authorization: Bearer abcdefghijkl")).toBe(
    "Authorization: Bearer [REDACTED]",
  );
  expect(redactProcessOutput('API_KEY "quoted secret" user:pass@https://example.test')).toBe(
    "API_KEY [REDACTED] user:pass@https://example.test",
  );
  expect(redactProcessOutput("https://alice:secret@example.test/path")).toBe(
    "https://[REDACTED]@example.test/path",
  );
});
