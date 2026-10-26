import { expect, test } from "@jest/globals";
import { shouldSkipDocumentationPath } from "../../../../../../../src/validation/shared/repository/create-repository/inventory/documentation/path-policy.mjs";

test.each([
  ["docs/.git/file.md", false, true],
  ["docs/node_modules/file.md", true, true],
  ["docs/test-results/file.md", true, true],
  ["docs/coverage/file.md", false, true],
  ["docs/coverage/file.md", true, false],
  ["docs/readme.md", false, false],
])("applies path policy to %s", (path, includeGenerated, expected) => {
  expect(shouldSkipDocumentationPath(path, includeGenerated)).toBe(expected);
});
