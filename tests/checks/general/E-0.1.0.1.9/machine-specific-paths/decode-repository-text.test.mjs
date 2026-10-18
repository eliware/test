import { expect, test } from "@jest/globals";
import { decodeRepositoryText } from "../../../../../src/checks/general/E-0.1.0.1.9/machine-specific-paths/decode-repository-text.mjs";

test("decodes valid UTF-8 text without NUL bytes", () => {
  expect(decodeRepositoryText(Buffer.from("repository path"))).toBe("repository path");
});

test("rejects NUL bytes and invalid UTF-8", () => {
  expect(decodeRepositoryText(Buffer.from([0x61, 0x00, 0x62]))).toBeNull();
  expect(decodeRepositoryText(Buffer.from([0xff, 0xfe]))).toBeNull();
});
