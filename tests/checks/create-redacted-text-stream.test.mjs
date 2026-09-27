import { expect, test } from "@jest/globals";
import { createRedactedTextStream } from "../../src/checks/create-redacted-text-stream.mjs";

test("redacts a configured secret split across text chunks", () => {
  const output = createRedactedTextStream(["opaque-token"], 100);
  expect(output.push("start opaq")).toBe("");
  expect(output.push("ue-token end")).toBe("start ");
  expect(output.finish()).toBe("[REDACTED] end");
  expect(output.finish()).toBe("");
});

test("redacts complete progress text", () => {
  const output = createRedactedTextStream(["opaque-token"], 100);
  expect(output.redactComplete("progress opaque-token")).toBe("progress [REDACTED]");
});

test("redacts complete secrets before trimming a trailing partial secret", () => {
  const output = createRedactedTextStream(["opaque-token", "credential-value"], 100);
  expect(output.redactComplete("progress opaque-token credential-")).toBe(
    "progress [REDACTED] ",
  );
});

test("matches multiple overlapping secret values", () => {
  const separate = createRedactedTextStream(["alpha-secret", "beta-secret"], 100);
  expect(separate.redactComplete("alpha-secret between beta-secret")).toBe(
    "[REDACTED] between [REDACTED]",
  );
  const overlap = createRedactedTextStream(["abc", "bcde"], 100);
  expect(overlap.redactComplete("abcde")).toBe("[REDACTED]");
});

test("suppresses complete diagnostics when matcher work exceeds its bounded budget", () => {
  const output = createRedactedTextStream(["a"], 600_000);
  expect(output.redactComplete("a".repeat(500_000))).toBe("");
});

test("suppresses an incomplete final byte sequence when completion exceeds the search budget", () => {
  const output = createRedactedTextStream(["zzzz"], 10, { maxSearchWorkPerChunk: 3 });
  expect(output.push(Buffer.from("abc"))).toBe("");
  expect(output.push(Buffer.from([0xf0]))).toBe("");
  expect(output.finish()).toBe("");
});

test("suppresses pending diagnostics when final decoding exhausts cumulative search work", () => {
  const output = createRedactedTextStream(["z"], 100, { maxSearchWorkPerChunk: 30 });
  expect(output.push("a".repeat(30))).toBe("a".repeat(29));
  expect(output.push(Buffer.from([0xf0]))).toBe("");
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
  expect(suppressed.redactComplete("x".repeat(5))).toBe("");
});

test("suppresses output for secrets longer than the retained matcher window", () => {
  const output = createRedactedTextStream(["x".repeat(64_001)], 100_000);
  expect(output.push("safe diagnostic")).toBe("");
  expect(output.finish()).toBe("");
});

test("bounds per-chunk secret search work across environments with many secrets", () => {
  const secrets = Array.from({ length: 300 }, (_, index) => `${index}`.padStart(3, "0") + "x".repeat(97));
  const output = createRedactedTextStream(secrets, 100_000);
  expect(output.redactComplete("diagnostic".repeat(400))).toBe("");
  expect(output.push("o".repeat(4_096))).toBe("o".repeat(3_996));
  expect(output.finish()).toBe("o".repeat(100));
});

test("suppresses an excessive pending secret scan when a stream finishes", () => {
  const secrets = Array.from({ length: 150 }, (_, index) => `${index}`.padStart(3, "0") + "x".repeat(4_897));
  const output = createRedactedTextStream(secrets, 5_000);
  expect(output.push("o".repeat(3_500))).toBe("");
  expect(output.finish()).toBe("");
});

test("bounds repeated scans while a long secret keeps the pending suffix large", () => {
  const secret = "s".repeat(10_000);
  const output = createRedactedTextStream([secret], 20_000, { maxSearchWorkPerChunk: 10_000 });
  expect(output.push("s".repeat(4_096))).toBe("");
  expect(output.push("s".repeat(4_096))).toBe("");
  expect(output.finish()).toBe("");
});

test("scans only new stream text when a long secret spans several chunks", () => {
  const secret = Array.from({ length: 10_000 }, (_, index) => String.fromCharCode(0x1000 + index)).join("");
  const output = createRedactedTextStream([secret], 30_000, { maxSearchWorkPerChunk: 30_000 });
  const text = secret + secret;
  const emitted = [];
  for (let start = 0; start < text.length; start += 4_096) {
    emitted.push(output.push(text.slice(start, start + 4_096)));
  }
  const result = emitted.join("") + output.finish();
  expect(result).not.toContain(secret);
  expect(result).toContain("[REDACTED]");
});

test("suppresses stream output when matcher work exceeds its estimate", () => {
  const output = createRedactedTextStream(["ab"], 5_000, { maxSearchWorkPerChunk: 4_096 });
  expect(output.push("a".repeat(3_000))).toBe("");
  expect(output.finish()).toBe("");
});

test("emits no current chunk after budget exhaustion following a safe prefix", () => {
  const output = createRedactedTextStream(["z"], 20_000, { maxSearchWorkPerChunk: 5_000 });
  expect(output.push(`safe${"x".repeat(4_092)}`)).toContain("safe");
  expect(output.push("x".repeat(4_096))).toBe("");
  expect(output.finish()).toBe("");
});



test("reuses matcher state when finishing a retained pending suffix", () => {
  const secret = "s".repeat(3_000);
  const output = createRedactedTextStream([secret], 10_000, { maxSearchWorkPerChunk: 6_500 });
  expect(output.push("s".repeat(4_096))).toBe("");
  expect(output.finish()).toBe("[REDACTED]");
});
