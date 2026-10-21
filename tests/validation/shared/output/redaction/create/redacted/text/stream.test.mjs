import { expect, jest, test } from "@jest/globals";
import { createRedactedTextStream } from "../../../../../../../../src/validation/shared/output/redaction/create/redacted/text/stream.mjs";

function createSession(secrets, outputLimit, options) {
  return createRedactedTextStream(secrets, outputLimit, options);
}

test("redacts a configured secret split across text chunks", () => {
  const output = createRedactedTextStream(["opaque-token"], 100);
  expect(output.push("start opaq")).toBe("");
  expect(output.push("ue-token end")).toBe("start ");
  expect(output.finish()).toBe("[REDACTED] end");
});

test("redacts equal-start secrets of different lengths across stream chunks", () => {
  const output = createRedactedTextStream(["abc", "abcdef"], 100);
  const result = output.push("prefix abc") + output.push("def suffix") + output.finish();

  expect(result).not.toContain("abc");
  expect(result).toContain("[REDACTED]");
  expect(result).toContain("suffix");
});

test("moves successive output boundaries before crossing overlapping secret intervals", () => {
  const secrets = ["abcdefghijkl", "fghijklmnop", "klmnopqrst"];
  const output = createRedactedTextStream(secrets, 1_000);
  const input = "safe---abcdefghijklmnopqrst---tail";
  let result = "";

  for (let index = 0; index < input.length; index += 3) {
    result += output.push(input.slice(index, index + 3));
  }
  result += output.finish();

  expect(result).toContain("safe---");
  expect(result).toContain("---tail");
  for (const secret of secrets) expect(result).not.toContain(secret);
  expect(result).not.toContain("abcdefgh");
});

test("redacts complete progress text and trailing partial secrets", () => {
  const output = createRedactedTextStream(["opaque-token", "credential-value"], 100);
  expect(output.redactComplete("progress opaque-token credential-")).toBe("progress [REDACTED] ");
});

test("uses an injected secret matcher when supplied", () => {
  const getSecretMatcher = jest.fn(
    () => (text) => Array.from({ length: text.length + 1 }, () => 0),
  );
  const output = createRedactedTextStream(["secret"], 100, { getSecretMatcher });

  expect(output.redactComplete("safe output")).toBe("safe output");
  expect(getSecretMatcher).toHaveBeenCalledWith(["secret"], { maxScanWork: 1_000_000 });
});

test("handles separate and overlapping secrets in complete output", () => {
  const separate = createRedactedTextStream(["alpha-secret", "beta-secret"], 100);
  expect(separate.redactComplete("alpha-secret between beta-secret")).toBe(
    "[REDACTED] between [REDACTED]",
  );
  const overlap = createRedactedTextStream(["abc", "bcde"], 100);
  expect(overlap.redactComplete("abcde")).toBe("[REDACTED]");
});

test("suppresses complete diagnostics when matcher work exceeds its budget", () => {
  const output = createRedactedTextStream(["a"], 600_000);
  expect(output.redactComplete("a".repeat(500_000))).toBe("");
});

test("checks complete output after the stream session exceeds its cumulative work budget", () => {
  const output = createRedactedTextStream(["secret"], 2_000_000, {
    maxSearchWorkPerChunk: 600_000,
  });
  output.push("x".repeat(400_000));
  output.push("x".repeat(400_000));

  expect(output.redactComplete("safe output")).toBe("safe output");
});

test("suppresses complete diagnostics after a runtime matcher failure", () => {
  const output = createRedactedTextStream(["secret"], 100, { getSecretMatcher: () => () => null });

  expect(output.push("safe prefix")).toBe("");
  expect(output.redactComplete("diagnostic secret")).toBe("");
});

test("does not convert stream chunks after policy suppression", () => {
  const output = createRedactedTextStream(["long-secret"], 4);
  const toString = jest.fn(() => "sensitive input");

  expect(output.push({ toString })).toBe("");
  expect(toString).not.toHaveBeenCalled();
});

test("keeps the output bound finite when the supplied limit is infinite", () => {
  const output = createRedactedTextStream([], Number.POSITIVE_INFINITY);
  const captured = output.push("x".repeat(100_100)) + output.finish();

  expect(captured.length).toBeLessThanOrEqual(100_000);
});

test("uses the default output limit when no limit is supplied", () => {
  const output = createRedactedTextStream([]);
  const captured = output.push("x".repeat(100_100)) + output.finish();

  expect(captured.length).toBeLessThanOrEqual(100_000);
});

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

test("suppresses environments with more secrets than the policy limit", () => {
  const secrets = Array(10_001).fill("secret");
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

test("suppresses output when repeated scans exceed the work limit", () => {
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

test("keeps offsets correct after a secret crosses chunks beyond an emitted prefix", () => {
  const session = createSession(["XXAB"], 100);
  const result = session.push("safeXX") + session.push("ABtail") + session.finish();
  expect(result).toBe("safe[REDACTED]tail");
  expect(result).not.toContain("XXAB");
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
});

test("suppresses all stream output when a secret exceeds the output limit", () => {
  const session = createSession(["x".repeat(101)], 100);
  expect(session.push("safe diagnostic")).toBe("");
  expect(session.finish()).toBe("");
});
