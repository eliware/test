import { expect, test } from "@jest/globals";
import {
  compatibleWithNode26,
  validatePackageRuntime,
} from "../../../../src/checks/general/E-0.1/validate-package-runtime.mjs";

test("validates Node.js and Jest runtime metadata", () => {
  expect(validatePackageRuntime({ engines: { node: "26" }, jest: {} })).toBeNull();
  expect(validatePackageRuntime({ engines: { node: ">=20" }, jest: {} })).toContain("Node.js 26");
  expect(validatePackageRuntime({ engines: { node: "26" }, jest: [] })).toContain("Jest");
  expect(validatePackageRuntime({ engines: { node: "^26" }, jest: {} })).toContain("exactly");
  expect(validatePackageRuntime({ engines: {}, jest: {} })).toContain("exactly");
});

test("accepts semantically equivalent Node 26 engine ranges", () => {
  for (const range of [
    ">=26.0.0 <27.0.0",
    ">= 26.0.0 < 27.0.0",
    "^26.1.0",
    "26.x",
    "26.4.2 - 26.8.0",
  ]) {
    expect(compatibleWithNode26(range)).toBe(true);
  }
  for (const range of [">=27", "not a range", "<26"])
    expect(compatibleWithNode26(range)).toBe(false);
});
