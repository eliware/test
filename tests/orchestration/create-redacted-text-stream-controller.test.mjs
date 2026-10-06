import { expect, test } from "@jest/globals";
import { createRedactedStreamPolicy } from "../../src/orchestration/create-redacted-stream-policy.mjs";
import { createRedactedTextStreamSession } from "../../src/orchestration/create-redacted-text-stream-controller.mjs";

function createSession(secrets, outputLimit, options) {
  const policy = createRedactedStreamPolicy(secrets, outputLimit, options);
  return createRedactedTextStreamSession(policy, outputLimit);
}

test("decodes UTF-8 secrets split across byte chunks", () => {
  const session = createSession(["🔐secret"], 100);
  const value = Buffer.from("before 🔐secret after");
  expect(session.push(value.subarray(0, 9))).toBe("");
  expect(session.push(value.subarray(9))).toBe("before ");
  expect(session.finish()).toBe("[REDACTED] after");
});

test("redacts a secret ending exactly at the emitted boundary", () => {
  const session = createSession(["secret"], 100);
  expect(session.push("secret--tail")).toBe("[REDACTED]");
  expect(session.finish()).toBe("--tail");
});

test("suppresses an incomplete final byte sequence when completion exceeds the search budget", () => {
  const session = createSession(["zzzz"], 10, { maxSearchWorkPerChunk: 3 });
  expect(session.push(Buffer.from("abc"))).toBe("");
  expect(session.push(Buffer.from([0xf0]))).toBe("");
  expect(session.finish()).toBe("");
});

test("suppresses pending diagnostics when final decoding exhausts cumulative search work", () => {
  const session = createSession(["z"], 100, { maxSearchWorkPerChunk: 30 });
  expect(session.push("a".repeat(30))).toBe("a".repeat(29));
  expect(session.push(Buffer.from([0xf0]))).toBe("");
  expect(session.finish()).toBe("");
  expect(session.suppressed).toBe(true);
});

test("trims a partial secret when the stream finishes", () => {
  const session = createSession(["credential-value"], 100);
  expect(session.push("safe credential-")).toBe("");
  expect(session.finish()).toBe("safe ");
});

test("makes finish idempotent and ignores later pushes", () => {
  const session = createSession([], 100);
  session.push("complete output");
  expect(session.finish()).toEqual(expect.any(String));
  expect(session.finish()).toBe("");
  expect(() => session.push("late input")).not.toThrow();
  expect(session.push("late input")).toBe("");
});

test("redacts a secret completed by the decoder's final replacement character", () => {
  const session = createSession(["secret�"], 100);
  expect(session.push(Buffer.from("secret"))).toBe("");
  expect(session.push(Buffer.from([0xf0]))).toBe("");
  expect(session.finish()).toBe("[REDACTED]");
});

test("advances past complete secrets before the retained boundary", () => {
  const session = createSession(["secret"], 100);
  expect(session.push(`secret ${"x".repeat(20)}`)).toBe(`[REDACTED] ${"x".repeat(14)}`);
  expect(session.finish()).toBe("x".repeat(6));
});

test("suppresses stream output when suffix preprocessing exceeds its work budget", () => {
  const secrets = Array.from({ length: 6 }, (_, index) => `${index}${"x".repeat(59_999)}`);
  const session = createSession(secrets, 100_000);
  expect(session.push("safe output")).toBe("");
  expect(session.finish()).toBe("");
  expect(session.suppressed).toBe(true);
});

test("expands the bounded matcher window for long secrets", () => {
  const secret = "x".repeat(64_001);
  const session = createSession([secret], 100_000);
  const output = session.push(`safe diagnostic ${secret}`) + session.finish();
  expect(output).toBe("safe diagnostic [REDACTED]");
  expect(output).not.toContain(secret);
});

test("bounds per-chunk secret search work with many secrets", () => {
  const secrets = Array.from(
    { length: 300 },
    (_, index) => `${index}`.padStart(3, "0") + "x".repeat(97),
  );
  const session = createSession(secrets, 100_000);
  expect(session.push("o".repeat(4_096))).toBe("o".repeat(3_996));
  expect(session.finish()).toBe("o".repeat(100));
});

test("handles environments with more secrets than a function call can accept", () => {
  const secrets = Array.from({ length: 150_000 }, (_, index) => `secret-${index}`);
  const session = createSession(secrets, 0);
  expect(session.push("diagnostic output")).toBe("");
  expect(session.finish()).toBe("");
});

test("suppresses an excessive pending secret scan when a stream finishes", () => {
  const secrets = Array.from(
    { length: 150 },
    (_, index) => `${index}`.padStart(3, "0") + "x".repeat(4_897),
  );
  const session = createSession(secrets, 5_000);
  expect(session.push("o".repeat(3_500))).toBe("");
  expect(session.finish()).toBe("");
});

test("bounds repeated scans while a long secret keeps the pending suffix large", () => {
  const session = createSession(["s".repeat(10_000)], 20_000, { maxSearchWorkPerChunk: 10_000 });
  expect(session.push("s".repeat(4_096))).toBe("");
  expect(session.push("s".repeat(4_096))).toBe("");
  expect(session.finish()).toBe("");
});

test("scans only new stream text when a long secret spans several chunks", () => {
  const secret = Array.from({ length: 10_000 }, (_, index) =>
    String.fromCharCode(0x1000 + index),
  ).join("");
  const session = createSession([secret], 30_000, { maxSearchWorkPerChunk: 30_000 });
  const text = secret + secret;
  const emitted = [];
  for (let start = 0; start < text.length; start += 4_096) {
    emitted.push(session.push(text.slice(start, start + 4_096)));
  }
  const result = emitted.join("") + session.finish();
  expect(result).not.toContain(secret);
  expect(result).toContain("[REDACTED]");
});

test("suppresses stream output when matcher work exceeds its estimate", () => {
  const session = createSession(["ab"], 5_000, { maxSearchWorkPerChunk: 4_096 });
  expect(session.push("a".repeat(3_000))).toBe("");
  expect(session.finish()).toBe("");
});

test("suppresses secret-bearing output when matcher intervals exceed the stream window", () => {
  const matcher = () => [];
  matcher.createStream = () => () => ({ matches: [{ start: 6, end: 100 }], work: 1 });
  const session = createSession(["secret"], 100, { getSecretMatcher: () => matcher });
  expect(session.push("secret-tail")).toBe("");
  expect(session.finish()).toBe("");
  expect(session.suppressed).toBe(true);
});

test("emits no current chunk after budget exhaustion following a safe prefix", () => {
  const session = createSession(["z"], 20_000, { maxSearchWorkPerChunk: 5_000 });
  expect(session.push(`safe${"x".repeat(4_092)}`)).toContain("safe");
  expect(session.push("x".repeat(4_096))).toBe("");
  expect(session.finish()).toBe("");
});

test("reuses matcher state when finishing a retained pending suffix", () => {
  const session = createSession(["s".repeat(3_000)], 10_000, { maxSearchWorkPerChunk: 6_500 });
  expect(session.push("s".repeat(4_096))).toBe("");
  expect(session.finish()).toBe("[REDACTED]");
});

test("expands a configured pending window to fit the longest secret", () => {
  const session = createSession(["secret"], 100, { maxPendingLength: 3 });
  const output = session.push("safe prefix") + session.finish();
  expect(output).toBe("safe prefix");
  expect(session.suppressed).toBe(false);
});
