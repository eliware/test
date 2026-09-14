import { expect, test } from "@jest/globals";
import {
  comparableLockfile,
  lockfilesMatch,
  normalizeLockfile,
} from "../../../../../src/checks/general/E-1/E-1.20/normalize-lockfile.mjs";

test("normalizes nested object keys while preserving arrays and scalar values", () => {
  expect(normalizeLockfile({ b: [2, { z: 1, a: 0 }], a: 1 })).toEqual({
    a: 1,
    b: [2, { a: 0, z: 1 }],
  });
  expect(normalizeLockfile("value")).toBe("value");
  expect(normalizeLockfile(null)).toBeNull();
});

test("compares only the lockfile identity and package map", () => {
  const lockfile = { lockfileVersion: 3, packages: { "": { name: "fixture" } }, ignored: true };
  expect(comparableLockfile(lockfile)).toEqual({ lockfileVersion: 3, packages: { "": { name: "fixture" } } });
  expect(lockfilesMatch(lockfile, { packages: { "": { name: "fixture" } }, lockfileVersion: 3 })).toBe(true);
  expect(lockfilesMatch(lockfile, { lockfileVersion: 2, packages: {} })).toBe(false);
});
