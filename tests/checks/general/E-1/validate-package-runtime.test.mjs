import { expect, test } from "@jest/globals";
import { validatePackageRuntime } from "../../../../src/checks/general/E-1/validate-package-runtime.mjs";

test("validates Node.js and Jest runtime metadata", () => {
  expect(validatePackageRuntime({ engines: { node: ">=26" }, jest: {} })).toBeNull();
  expect(validatePackageRuntime({ engines: { node: ">=20" }, jest: {} })).toContain("Node.js 26");
  expect(validatePackageRuntime({ engines: { node: ">=26" }, jest: [] })).toContain("Jest");
});
