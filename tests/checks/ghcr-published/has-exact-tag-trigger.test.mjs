import { expect, test } from "@jest/globals";
import { hasExactTagTrigger } from "../../../src/checks/ghcr-published/has-exact-tag-trigger.mjs";

test("accepts only the canonical version-tag push trigger", () => {
  expect(hasExactTagTrigger({ document: { on: { push: { tags: ["v*.*.*"] } } } })).toBe(true);
  expect(hasExactTagTrigger({ document: { true: { push: { tags: ["v*.*.*"] } } } })).toBe(true);
  expect(hasExactTagTrigger({ document: { on: { push: { tags: ["other"] } } } })).toBe(false);
  expect(hasExactTagTrigger({ document: { on: { push: { tags: ["v*.*.*"] }, workflow_dispatch: {} } } })).toBe(false);
  expect(hasExactTagTrigger({ document: {} })).toBe(false);
});
