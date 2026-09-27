import { expect, test } from "@jest/globals";
import { hasNpmProvenancePublish } from "../../../../src/checks/npm-published/E-0.1.140/has-npm-provenance-publish.mjs";

test("requires an approved npm publish command with provenance", () => {
  expect(hasNpmProvenancePublish({ steps: [{ run: "npm publish --provenance" }] })).toBe(true);
  expect(hasNpmProvenancePublish({ steps: [{ run: "npm publish" }] })).toBe(false);
  expect(hasNpmProvenancePublish({ steps: [{}] })).toBe(false);
  expect(
    hasNpmProvenancePublish({ steps: [{ run: "npm publish --provenance && echo extra" }] }),
  ).toBe(false);
});
