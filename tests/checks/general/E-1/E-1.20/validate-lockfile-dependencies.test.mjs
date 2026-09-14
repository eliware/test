import { expect, test } from "@jest/globals";
import { validateLockfileDependencies } from "../../../../../src/checks/general/E-1/E-1.20/validate-lockfile-dependencies.mjs";

test("validates dependency maps and direct package entries", () => {
  const packageJson = { dependencies: { alpha: "1.0.0" } };
  const lockfile = { packages: { "": { dependencies: { alpha: "1.0.0" } }, "node_modules/alpha": {} } };
  expect(validateLockfileDependencies(lockfile, packageJson)).toBeNull();
  expect(validateLockfileDependencies({ packages: { "": {} } }, packageJson)).toMatch(/root dependencies/);
  expect(validateLockfileDependencies({ packages: { "": { dependencies: packageJson.dependencies } } }, packageJson)).toMatch(/direct dependency/);
});
