import { expect, test } from "@jest/globals";
import { validateExternalDocumentationLink } from "../../../../src/checks/documentation/E-0.1.100/validate-external-documentation-link.mjs";

test("accepts valid web and email references", () => {
  for (const reference of ["http://example.test", "https://example.test/path", "mailto:support@example.test"]) {
    expect(validateExternalDocumentationLink(reference)).toBeNull();
  }
});

test("rejects malformed email, unsupported protocol, and malformed web URLs", () => {
  for (const reference of ["mailto:not-an-address", "ftp://example.test/file", "https://"]) {
    expect(validateExternalDocumentationLink(reference)).toBe(`Documentation link is invalid: ${reference}.`);
  }
});
