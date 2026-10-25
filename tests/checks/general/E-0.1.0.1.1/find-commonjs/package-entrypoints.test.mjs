import { expect, test } from "@jest/globals";
import { hasCommonJsPackageEntrypoint } from "../../../../../src/checks/general/E-0.1.0.1.1/find-commonjs/package-entrypoints.mjs";

test.each([
  [{ main: "./index.cjs" }, true],
  [{ exports: { import: "./index.mjs", require: "./index.cts" } }, true],
  [{ main: "./index.mjs", description: "CommonJS is not used." }, false],
  [undefined, false],
])("detects CommonJS package targets in %#", (packageJson, expected) => {
  expect(hasCommonJsPackageEntrypoint(packageJson)).toBe(expected);
});
