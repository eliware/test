import { expect, test } from "@jest/globals";
import { redactCompleteOutput } from "../../../../../src/validation/shared/output/redaction/redact-complete-output.mjs";
import { createSecretTextMatcher } from "../../../../../src/validation/shared/output/redaction/create-secret-text-matcher.mjs";

test("redacts known matches and trims a partial secret suffix", () => {
  expect(
    redactCompleteOutput("progress opaque-token credential-", {
      suppressed: false,
      values: ["opaque-token"],
      workLimit: 100,
      findSecretEnds: createSecretTextMatcher(["opaque-token"]),
      trimSuffix: (text) => text.replace("credential-", ""),
    }),
  ).toBe("progress [REDACTED] ");
});

test("suppresses diagnostics when policy, search budget, or matcher rejects them", () => {
  const options = {
    suppressed: false,
    values: ["secret"],
    workLimit: 2,
    findSecretEnds: () => null,
    trimSuffix: (text) => text,
  };
  expect(redactCompleteOutput("safe", { ...options, suppressed: true })).toBe("");
  expect(redactCompleteOutput("safe", options)).toBe("");
  expect(
    redactCompleteOutput("safe", { ...options, workLimit: 10, findSecretEnds: () => null }),
  ).toBe("");
  expect(
    redactCompleteOutput("visible secret", {
      ...options,
      workLimit: 100,
      findSecretEnds: (text) => Array.from({ length: text.length + 1 }, () => 0),
    }),
  ).toBe("");
  expect(
    redactCompleteOutput("x", {
      ...options,
      workLimit: 10,
      findSecretEnds: () => {
        const matchEnds = [0, 0];
        delete matchEnds[0];
        return matchEnds;
      },
    }),
  ).toBe("");
});
