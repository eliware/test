import { expect, test } from "@jest/globals";
import { hasDocumentedLatestAlias } from "../../../src/checks/ghcr-published/has-documented-latest-alias.mjs";

test("requires latest to be documented as a mutable convenience alias, not an identity", () => {
  expect(
    hasDocumentedLatestAlias(
      "The latest tag is a mutable convenience alias and is never the release or deployment identity.",
    ),
  ).toBe(true);
  expect(hasDocumentedLatestAlias("The latest tag is a convenience alias.")).toBe(false);
  expect(
    hasDocumentedLatestAlias("The latest tag is a mutable convenience alias, never the release identity."),
  ).toBe(false);
  expect(hasDocumentedLatestAlias(null)).toBe(false);
});
