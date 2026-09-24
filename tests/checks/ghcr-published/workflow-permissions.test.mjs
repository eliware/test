import { expect, test } from "@jest/globals";
import { permissions } from "../../../src/checks/ghcr-published/workflow-permissions.mjs";

test("prefers job permissions and otherwise inherits workflow permissions", () => {
  const workflow = { document: { permissions: { contents: "read" } } };
  expect(permissions(workflow, {})).toEqual({ contents: "read" });
  expect(permissions(workflow, { permissions: { packages: "write" } })).toEqual({ packages: "write" });
  expect(permissions({ document: {} }, {})).toEqual({});
});
