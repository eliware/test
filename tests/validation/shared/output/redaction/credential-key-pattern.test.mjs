import { expect, test } from "@jest/globals";
import { credentialKeyPattern } from "../../../../../src/validation/shared/output/redaction/credential-key-pattern.mjs";

test("matches supported credential field names", () => {
  const pattern = new RegExp(`^(?:${credentialKeyPattern})$`, "iu");
  for (const key of ["token", "apiKey", "clientSecret", "session_id", "private-key"])
    expect(pattern.test(key)).toBe(true);
});

test("does not match ordinary field names", () => {
  const pattern = new RegExp(`^(?:${credentialKeyPattern})$`, "iu");
  for (const key of ["username", "email", "description"]) expect(pattern.test(key)).toBe(false);
});
