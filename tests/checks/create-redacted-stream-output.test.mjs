import { expect, test } from "@jest/globals";
import { createRedactedStreamOutput } from "../../src/checks/create-redacted-stream-output.mjs";

test("appends sanitized text only up to the remaining output limit", () => {
  const output = createRedactedStreamOutput(4);
  expect(output.append("abcdef", [])).toBe("abcd");
  expect(output.outputLength).toBe(4);
  expect(output.canContinue()).toBe(false);
  expect(output.append("later", [])).toBe("");
});

test("does not emit a partial redaction marker at the output boundary", () => {
  const output = createRedactedStreamOutput(15);
  const matchEnds = Array.from({ length: 18 }, (_, index) => (index === 12 ? 18 : 0));
  expect(output.append("123456789012secret", matchEnds)).toBe("123456789012");
});

test("bounds intermediate text by code units before the caller applies a byte budget", () => {
  const output = createRedactedStreamOutput(2);
  const text = output.append("é漢", []);

  expect(text).toBe("é漢");
  expect(output.outputLength).toBe(2);
  expect(Buffer.byteLength(text)).toBeGreaterThan(output.outputLength);
});
