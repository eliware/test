import { expect, jest, test } from "@jest/globals";
import { createRedactedTextStream } from "../../src/checks/create-redacted-text-stream.mjs";

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
  const getSecretMatcher = jest.fn(() => () => []);
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

test("suppresses complete output after the stream session exceeds its suffix work budget", () => {
  const secrets = Array.from({ length: 6 }, (_, index) => `${index}${"x".repeat(59_999)}`);
  const output = createRedactedTextStream(secrets, 100_000);
  output.push("safe output");

  expect(output.redactComplete("safe output")).toBe("");
});
