import { expect, test } from "@jest/globals";
import { validateLockfileDependencies } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-lockfile-dependencies.mjs";

const lockfile = (alpha, extra = {}) => ({
  packages: { "": {}, "node_modules/alpha": alpha, ...extra },
});
const packageEntry = (extra = {}) => ({ version: "1.0.0", resolved: "file:alpha", ...extra });
const invalid = (input, pattern, manifest = {}) =>
  expect(validateLockfileDependencies(input, manifest)).toMatch(pattern);

test("validates lockfile dependency maps and package entries", () => {
  const manifest = { dependencies: { alpha: "1.0.0" } };
  expect(
    validateLockfileDependencies(
      {
        packages: {
          "": { dependencies: manifest.dependencies },
          "node_modules/alpha": packageEntry(),
        },
      },
      manifest,
    ),
  ).toBeNull();
  invalid({ packages: { "": {} } }, /root dependencies/u, manifest);
  expect(
    validateLockfileDependencies(
      { packages: { "": { dependencies: manifest.dependencies } } },
      manifest,
    ),
  ).toMatch(/direct dependency/u);
  invalid({ packages: [] }, /packages/u);
  invalid({ packages: {} }, /root packages/u);
  expect(validateLockfileDependencies(lockfile({ version: "1.0.0" }), {})).toBeNull();
  invalid(lockfile(packageEntry({ dependencies: { missing: "1.0.0" } })), /missing dependency/u);
  expect(
    validateLockfileDependencies(
      lockfile(
        packageEntry({
          peerDependencies: { optional: "1.0.0" },
          peerDependenciesMeta: { optional: { optional: true } },
        }),
      ),
      {},
    ),
  ).toBeNull();

  for (const entry of [null, [], { name: 1, ...packageEntry() }, { name: "", ...packageEntry() }]) {
    invalid(lockfile(entry), /valid package version/u);
  }

  expect(
    validateLockfileDependencies(
      lockfile(
        { resolved: "packages/alpha", link: true },
        {
          "packages/alpha": { name: "alpha", version: "1.0.0" },
        },
      ),
      {},
    ),
  ).toBeNull();
  invalid(
    lockfile(
      { resolved: "packages/alpha", link: true, dependencies: [] },
      {
        "packages/alpha": { name: "alpha", version: "1.0.0" },
      },
    ),
    /entry node_modules\/alpha has invalid dependencies/u,
  );
  invalid(
    lockfile(
      { resolved: "packages/alpha", link: true, dependencies: { missing: "1.0.0" } },
      {
        "packages/alpha": { name: "alpha", version: "1.0.0" },
      },
    ),
    /entry node_modules\/alpha references missing dependency missing/u,
  );
  invalid({ packages: { "": {}, "node_modules/alpha": { link: true } } }, /valid resolved target/u);
  invalid(lockfile({ ...packageEntry(), dependencies: [] }), /invalid dependencies/u);

  for (const packages of [
    {
      "node_modules/a/node_modules/alpha": packageEntry({ dependencies: { beta: "1.0.0" } }),
      "node_modules/beta": { version: "1.0.0", resolved: "https://registry" },
    },
    {
      "node_modules/alpha": { version: "1.0.0", resolved: "https://registry" },
    },
    {
      "node_modules/alpha": {
        version: "1.0.0",
        resolved: "https://registry",
        dependencies: { beta: "1.0.0" },
      },
      "node_modules/beta": { version: "1.0.0", resolved: "https://registry" },
    },
    {
      "node_modules/foo/node_modules/alpha": {
        version: "1.0.0",
        resolved: "https://registry",
        dependencies: { beta: "1.0.0" },
      },
      "node_modules/foo/node_modules/alpha/node_modules/beta": {
        version: "1.0.0",
        resolved: "https://registry",
      },
    },
  ]) {
    expect(validateLockfileDependencies({ packages: { "": {}, ...packages } }, {})).toBeNull();
  }
});
