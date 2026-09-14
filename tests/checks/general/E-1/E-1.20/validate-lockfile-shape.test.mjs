import { expect, test } from "@jest/globals";
import { validateLockfileShape } from "../../../../../src/checks/general/E-1/E-1.20/validate-lockfile-shape.mjs";

test("validates lockfile identity, version, and root package shape", () => {
  const packageJson = { name: "fixture", version: "1.0.0" };
  expect(validateLockfileShape({ name: "fixture", version: "1.0.0", lockfileVersion: 3, packages: { "": packageJson } }, packageJson)).toBeNull();
  expect(validateLockfileShape({ name: "other", version: "1.0.0", lockfileVersion: 3, packages: { "": packageJson } }, packageJson)).toMatch(/name and version/);
  expect(validateLockfileShape({ name: "fixture", version: "1.0.0", lockfileVersion: 2, packages: { "": packageJson } }, packageJson)).toMatch(/version 3/);
  expect(validateLockfileShape({ name: "fixture", version: "1.0.0", lockfileVersion: 3, packages: {} }, packageJson)).toMatch(/root package/);
});
