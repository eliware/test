import { expect, test } from "@jest/globals";
import { buildSecretTextAutomaton } from "../../../../../src/validation/shared/output/redaction/build-secret-text-automaton.mjs";
import { scanSecretTextAutomaton } from "../../../../../src/validation/shared/output/redaction/scan-secret-text-automaton.mjs";

test("finds overlapping secrets through failure and output links", () => {
  const nodes = buildSecretTextAutomaton(["he", "she", "hers"], 100);
  const result = scanSecretTextAutomaton(nodes, "ushers", 100);
  expect(result.matchEnds[1]).toBe(4);
  expect(result.matchEnds[2]).toBe(6);
  expect(result.matches).toContainEqual({ start: 2, end: 4 });
});

test("continues scanning from an automaton state with absolute offsets", () => {
  const nodes = buildSecretTextAutomaton(["secret"], 100);
  const first = scanSecretTextAutomaton(nodes, "safe se", 100);
  expect(first.matches).toEqual([]);
  const second = scanSecretTextAutomaton(nodes, "cret", 100, first.state, 7);
  expect(second.matches).toEqual([{ start: 5, end: 11 }]);
  expect(second.work).toBeLessThan(7);
});

test("bounds scanning transitions and matched output work", () => {
  const single = buildSecretTextAutomaton(["a"], 100);
  expect(scanSecretTextAutomaton(single, "aa", 1)).toBeNull();
  expect(scanSecretTextAutomaton(buildSecretTextAutomaton(["aa"], 100), "aa", 1)).toBeNull();

  const repeated = buildSecretTextAutomaton(["aaaaa"], 100);
  expect(scanSecretTextAutomaton(repeated, "aaaaax", 9)).toBeNull();
  expect(scanSecretTextAutomaton(repeated, "", 0)).toMatchObject({ matches: [], work: 0 });
});

test("falls back through suffix states when a later character mismatches", () => {
  const nodes = buildSecretTextAutomaton(["abx", "bcy"], 100);
  const result = scanSecretTextAutomaton(nodes, "abz", 100);
  expect(result).not.toBeNull();
  expect(result.matches).toEqual([]);
});

test("uses JavaScript string offsets for non-BMP matches", () => {
  const secret = "🔐secret";
  const nodes = buildSecretTextAutomaton([secret], 100);
  const text = `before ${secret} after`;
  const result = scanSecretTextAutomaton(nodes, text, 100);
  const start = text.indexOf(secret);
  expect(result.matchEnds[start]).toBe(start + secret.length);
});
