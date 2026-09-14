import { expect, test } from "@jest/globals";
import { validateLockfileDependencies } from "../../../../../src/checks/general/E-1/E-1.20/validate-lockfile-dependencies.mjs";

test("validates dependency maps and direct package entries", () => {
  const packageJson = { dependencies: { alpha: "1.0.0" } };
  const lockfile = { packages: { "": { dependencies: { alpha: "1.0.0" } }, "node_modules/alpha": { version: "1.0.0", resolved: "https://registry.npmjs.org/alpha/-/alpha-1.0.0.tgz" } } };
  expect(validateLockfileDependencies(lockfile, packageJson)).toBeNull();
  expect(validateLockfileDependencies({ packages: { "": {} } }, packageJson)).toMatch(/root dependencies/);
  expect(validateLockfileDependencies({ packages: { "": { dependencies: packageJson.dependencies } } }, packageJson)).toMatch(/direct dependency/);
  expect(validateLockfileDependencies({ packages: [] }, {})).toMatch(/packages/);
  expect(validateLockfileDependencies({ packages: {} }, {})).toMatch(/root packages/);
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/alpha": { version: "1.0.0" } } }, {})).toMatch(/resolved or integrity/);
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/alpha": { version: "1.0.0", resolved: "file:alpha", dependencies: { missing: "1.0.0" } } } }, {})).toMatch(/missing dependency/);
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/alpha": { version: "1.0.0", resolved: "file:alpha", peerDependencies: { optional: "1.0.0" }, peerDependenciesMeta: { optional: { optional: true } } } } }, {})).toBeNull();
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/alpha": null } }, {})).toMatch(/valid package version/);
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/alpha": { version: "1.0.0", link: true } } }, {})).toBeNull();
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/alpha": { version: "1.0.0", resolved: "https://registry", dependencies: [] } } }, {})).toMatch(/invalid dependencies/);
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/a/node_modules/alpha": { version: "1.0.0", resolved: "file:alpha", dependencies: { beta: "1.0.0" } }, "node_modules/beta": { version: "1.0.0", resolved: "https://registry" } } }, {})).toBeNull();
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/alpha": { version: "1.0.0", resolved: "https://registry" } } }, {})).toBeNull();
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/alpha": { version: "1.0.0", resolved: "https://registry", dependencies: { beta: "1.0.0" } }, "node_modules/beta": { version: "1.0.0", resolved: "https://registry" } } }, {})).toBeNull();
  expect(validateLockfileDependencies({ packages: { "": {}, "node_modules/foo/node_modules/alpha": { version: "1.0.0", resolved: "https://registry", dependencies: { beta: "1.0.0" } }, "node_modules/foo/node_modules/alpha/node_modules/beta": { version: "1.0.0", resolved: "https://registry" } } }, {})).toBeNull();
});
