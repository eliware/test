import { expect, test } from "@jest/globals";
import { validateExternalLink } from "../../../../src/checks/general/E-0.1.0.1.4/validate-external-markdown-link.mjs";

test("accepts valid HTTP, HTTPS, and mail links", () => {
  expect(validateExternalLink("https://example.com/path")).toBeNull();
  expect(validateExternalLink("https://github.com/eliware/test")).toBeNull();
  expect(validateExternalLink("mailto:help@example.com")).toBeNull();
});

test("rejects malformed protocols, GitHub HTTP links, and credentials", () => {
  expect(validateExternalLink("mailto:not-an-email")).toContain("invalid");
  expect(validateExternalLink("ftp://example.com")).toContain("invalid");
  expect(validateExternalLink("http://github.com/eliware/test")).toContain("invalid");
  expect(validateExternalLink("https://user:pass@example.com")).toContain("invalid");
  expect(validateExternalLink("not a URL")).toContain("invalid");
});
