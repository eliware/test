import { expect, test } from "@jest/globals";
import { createRedactedTextStream } from "../../src/checks/create-redacted-text-stream.mjs";

test("redacts a configured secret split across text chunks", () => {
  const output = createRedactedTextStream(["opaque-token"], 100);
  expect(output.push("start opaq")).toBe("");
  expect(output.push("ue-token end")).toBe("start ");
  expect(output.finish()).toBe("[REDACTED] end");
  expect(output.finish()).toBe("");
});

test("decodes UTF-8 secrets split across byte chunks", () => {
  const output = createRedactedTextStream(["🔐secret"], 100);
  const value = Buffer.from("before 🔐secret after");
  expect(output.push(value.subarray(0, 9))).toBe("");
  expect(output.push(value.subarray(9))).toBe("before ");
  expect(output.finish()).toBe("[REDACTED] after");
});

test("trims a partial secret when the stream finishes", () => {
  const output = createRedactedTextStream(["credential-value"], 100);
  expect(output.push("safe credential-")).toBe("");
  expect(output.finish()).toBe("safe ");
});

test("advances past complete secrets before the retained boundary", () => {
  const output = createRedactedTextStream(["secret"], 100);
  expect(output.push(`secret ${"x".repeat(20)}`)).toBe(`[REDACTED] ${"x".repeat(14)}`);
  expect(output.finish()).toBe("x".repeat(6));
});

test("bounds sanitized output and suppresses output for oversized secrets", () => {
  const bounded = createRedactedTextStream([], 4);
  expect(bounded.push("abcdef")).toBe("abcd");
  expect(bounded.push("g")).toBe("");
  expect(bounded.finish()).toBe("");

  const suppressed = createRedactedTextStream(["x".repeat(5)], 4);
  expect(suppressed.push("output")).toBe("");
  expect(suppressed.finish()).toBe("");
});
