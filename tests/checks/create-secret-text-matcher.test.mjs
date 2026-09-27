import { expect, test } from "@jest/globals";
import { createSecretTextMatcher } from "../../src/checks/create-secret-text-matcher.mjs";

test("finds overlapping secrets with failure-link matching", () => {
  const findSecretEnds = createSecretTextMatcher(["he", "she", "hers"]);
  const ends = findSecretEnds("ushers");
  expect(ends[1]).toBe(4);
  expect(ends[2]).toBe(6);
});

test("returns no matches for an empty environment and bounds scan work", () => {
  expect(createSecretTextMatcher([])("plain")).toEqual([0, 0, 0, 0, 0, 0]);
  expect(createSecretTextMatcher([], { maxScanWork: 0 })("x")).toBeNull();
  expect(createSecretTextMatcher(["a"])("a".repeat(1_000_001))).toBeNull();
  expect(createSecretTextMatcher(["a"], { maxScanWork: 1 })("bb")).toBeNull();
  expect(createSecretTextMatcher(["abc"], { maxScanWork: 2 })("abx")).toBeNull();
  expect(createSecretTextMatcher(["a"], { maxScanWork: 0 })("")).toBeNull();
  expect(createSecretTextMatcher(["abx", "bcy"], { maxScanWork: 6 })("")).toBeNull();
  expect(createSecretTextMatcher(["abx", "bcy"], { maxScanWork: 8 })("")).toBeNull();
  expect(createSecretTextMatcher(["ab"], { maxScanWork: 100 })("ac")).not.toBeNull();
  expect(createSecretTextMatcher(["a"], { maxScanWork: 3 })("a")).not.toBeNull();
  expect(createSecretTextMatcher(["ab", "bc"], { maxScanWork: 8 })("abd")).not.toBeNull();
  expect(createSecretTextMatcher(["abc", "bcx"], { maxScanWork: 13 })("abz")).not.toBeNull();
  expect(createSecretTextMatcher(["a"], { maxScanWork: 2 })("a")).not.toBeNull();
  expect(createSecretTextMatcher(["aaaaa"], { maxScanWork: 9 })("aaaaax")).toBeNull();
});

test("keeps trie construction work separate from each bounded text scan", () => {
  const findSecretEnds = createSecretTextMatcher(["a".repeat(4_500)], { maxScanWork: 9_000 });
  expect(findSecretEnds("zz")).not.toBeNull();
});

test("builds suffix fallback links when an earlier prefix cannot continue", () => {
  const ends = createSecretTextMatcher(["abcd", "bcx"])("abcx");
  expect(ends[1]).toBe(4);
});

test("matches non-BMP secrets using JavaScript string offsets", () => {
  const secret = "🔐secret";
  const text = `before ${secret} after`;
  const ends = createSecretTextMatcher([secret])(text);
  const start = text.indexOf(secret);
  expect(ends[start]).toBe(start + secret.length);
});
