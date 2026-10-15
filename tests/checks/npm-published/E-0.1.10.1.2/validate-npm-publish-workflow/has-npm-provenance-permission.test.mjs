import { expect, test } from "@jest/globals";
import { hasNpmProvenancePermission } from "../../../../../src/checks/npm-published/E-0.1.10.1.2/validate-npm-publish-workflow/has-npm-provenance-permission.mjs";

test.each([
  [{ permissions: { "id-token": "write" }, jobs: { publish: {} } }, true],
  [{ jobs: { publish: { permissions: { "id-token": "write" } } } }, true],
  [
    {
      permissions: { "id-token": "write" },
      jobs: { publish: { permissions: { contents: "read" } } },
    },
    false,
  ],
  [{ jobs: { publish: { permissions: { "id-token": "read" } } } }, false],
  [{ jobs: { publish: {} } }, false],
  [undefined, false],
  [{ permissions: "write-all", jobs: { publish: {} } }, false],
])("checks effective npm provenance permissions", (workflow, expected) => {
  expect(hasNpmProvenancePermission(workflow)).toBe(expected);
});
