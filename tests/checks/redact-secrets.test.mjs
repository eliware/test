import { expect, test } from "@jest/globals";
import { redactMatchedSecrets, trimPartialSecretSuffix } from "../../src/checks/redact-secrets.mjs";

test("redacts overlapping and separate secret ranges", () => {
  expect(redactMatchedSecrets("abcde and xy", [5, 5, 5, 5, 5, 0, 0, 0, 0, 0, 12, 12, 0])).toBe(
    "[REDACTED] and [REDACTED]",
  );
  expect(redactMatchedSecrets("ordinary", [])).toBe("ordinary");
  expect(redactMatchedSecrets("abcdef", [0, 0, 6], 4)).toBe("abcd");
});

test("trims a partial secret suffix using bounded prefix matching", () => {
  expect(trimPartialSecretSuffix("prefix credential-", ["credential-value"])).toBe("prefix ");
  expect(trimPartialSecretSuffix("ababab", ["ababac"])).toBe("ab");
  expect(trimPartialSecretSuffix("ababy", ["ababac"])).toBe("ababy");
  expect(trimPartialSecretSuffix("ordinary", [])).toBe("ordinary");
});
