import { expect, test } from "@jest/globals";
import { validateLockfilePackageEntries } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-lockfile-package-entries.mjs";

test("accepts linked entries and resolves nested dependencies to the nearest package", () => {
  const packages = {
    "": {},
    "node_modules/team/node_modules/alpha": {
      version: "1.0.0",
      link: true,
      resolved: "packages/alpha",
      dependencies: { beta: "1.0.0" },
      peerDependencies: { optional: "1.0.0" },
      peerDependenciesMeta: { optional: { optional: true } },
    },
    "node_modules/team/node_modules/beta": { version: "1.0.0" },
  };
  expect(validateLockfilePackageEntries(packages)).toBeNull();
});

test("reports malformed entries, link targets, dependency maps and references", () => {
  const error = validateLockfilePackageEntries({
    "": {},
    "node_modules/array": [],
    "node_modules/bad-link": { link: true },
    "node_modules/bad-name": { name: "", version: "1.0.0" },
    "node_modules/bad-map": { version: "1.0.0", dependencies: [] },
    "node_modules/missing": {
      version: "1.0.0",
      dependencies: { absent: "1.0.0" },
    },
  });
  expect(error).toContain("node_modules/array must contain a valid package version");
  expect(error).toContain("node_modules/bad-link must contain a valid resolved target");
  expect(error).toContain("node_modules/bad-name must contain a valid package version");
  expect(error).toContain("node_modules/bad-map has invalid dependencies");
  expect(error).toContain("node_modules/missing references missing dependency absent");
});
