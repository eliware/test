import { expect, test } from "@jest/globals";
import { normalizeRedactionPolicySecrets } from "../../../../../src/validation/shared/output/redaction/normalize-redaction-policy-secrets.mjs";

test("filters invalid values, removes duplicates, and sorts longest first", () => {
  expect(normalizeRedactionPolicySecrets(["short", "long-secret", "short", "", 4])).toEqual([
    "long-secret",
    "short",
  ]);
});

test("rejects excessive unique secrets and total secret length", () => {
  expect(
    normalizeRedactionPolicySecrets(Array.from({ length: 10_001 }, (_, index) => `key-${index}`)),
  ).toBeNull();
  expect(normalizeRedactionPolicySecrets(["s".repeat(166_667)])).toBeNull();
});

test("stops reading excessive duplicate inputs", () => {
  let reads = 0;
  const secrets = {
    *[Symbol.iterator]() {
      while (true) {
        reads += 1;
        yield "same-secret";
      }
    },
  };

  expect(normalizeRedactionPolicySecrets(secrets)).toBeNull();
  expect(reads).toBe(10_001);
});
