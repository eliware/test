import { expect, test } from "@jest/globals";
import isInsideNodeModules from "../../../../../src/validation/stages/smoke/restore/is-inside-node-modules.mjs";
test("matches node_modules paths and rejects adjacent paths", () => {
  expect(isInsideNodeModules("/consumer", "/consumer/node_modules/pkg/file.js")).toBe(true);
  expect(isInsideNodeModules("/consumer", "/consumer/node_modules")).toBe(true);
  expect(isInsideNodeModules("/consumer", "/consumer/node_modules-old/pkg")).toBe(false);
  expect(isInsideNodeModules("/consumer", "/consumer/package.json")).toBe(false);
});
