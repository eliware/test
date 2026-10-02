import { expect, test } from "@jest/globals";
import { hasExactTagTrigger } from "../../../src/checks/ghcr-published/has-exact-tag-trigger.mjs";
import { releaseTagFilter } from "../../../src/checks/ghcr-published/release-version-tag.mjs";

test("accepts only the canonical version-tag push trigger", () => {
  expect(hasExactTagTrigger({ document: { on: { push: { tags: [releaseTagFilter] } } } })).toBe(
    true,
  );
  expect(hasExactTagTrigger({ document: { true: { push: { tags: [releaseTagFilter] } } } })).toBe(
    true,
  );
  expect(hasExactTagTrigger({ document: { on: { push: { tags: ["other"] } } } })).toBe(false);
  expect(
    hasExactTagTrigger({
      document: { on: { push: { tags: [releaseTagFilter] }, workflow_dispatch: {} } },
    }),
  ).toBe(false);
  expect(
    hasExactTagTrigger({ document: { on: { push: { tags: ["v[0-9]+.[0-9]+.[0-9]+"] } } } }),
  ).toBe(false);
  expect(hasExactTagTrigger({ document: { on: { push: { tags: ["v*.*.*"] } } } })).toBe(false);
  expect(
    hasExactTagTrigger({
      document: { on: { push: { tags: [releaseTagFilter], branches: ["main"] } } },
    }),
  ).toBe(false);
  expect(
    hasExactTagTrigger({
      document: { on: { push: { tags: [releaseTagFilter], "tags-ignore": ["legacy.*"] } } },
    }),
  ).toBe(false);
  expect(hasExactTagTrigger({ document: {} })).toBe(false);
});
