import { expect, test } from "@jest/globals";
import { createSecretTextMatcher } from "../../src/orchestration/create-secret-text-matcher.mjs";

test("returns empty match indexes when there are no secrets", () => {
  expect(createSecretTextMatcher([])("plain")).toEqual([0, 0, 0, 0, 0, 0]);
  expect(createSecretTextMatcher([], { maxScanWork: 0 })("x")).toBeNull();
});

test("exposes batch and streaming matches from the constructed matcher", () => {
  const matcher = createSecretTextMatcher(["a"]);
  expect(matcher("a")).toEqual(expect.arrayContaining([1, 0]));
  expect(matcher.createStream()("a")).toMatchObject({
    matches: [{ start: 0, end: 1 }],
  });
});

test("returns a suppressing matcher when construction exceeds its work budget", () => {
  expect(createSecretTextMatcher(["secret"], { maxScanWork: 2 })("secret")).toBeNull();
});

test("preserves bounded scan behavior through the public matcher", () => {
  expect(createSecretTextMatcher(["a"], { maxScanWork: 1 })("bb")).toBeNull();
  expect(createSecretTextMatcher(["a"], { maxScanWork: 3 })("a")).not.toBeNull();
  expect(createSecretTextMatcher(["a"], { maxScanWork: 1 }).createStream()("bb")).toBeNull();
});
