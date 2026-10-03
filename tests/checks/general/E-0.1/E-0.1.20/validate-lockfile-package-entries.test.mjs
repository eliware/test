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
    "packages/alpha": { version: "1.0.0" },
    "packages/alpha/node_modules/beta": { version: "1.0.0" },
    "node_modules/parent": { version: "1.0.0" },
    "node_modules/parent/node_modules/child": {
      version: "1.0.0",
      dependencies: { sibling: "1.0.0" },
    },
    "node_modules/parent/node_modules/sibling": { version: "1.0.0" },
  };
  expect(validateLockfilePackageEntries(packages)).toBeNull();
});

test("reports malformed entries, link targets, dependency maps and references", () => {
  const error = validateLockfilePackageEntries({
    "": {},
    "node_modules/array": [],
    "node_modules/bad-link": { link: true },
    "node_modules/outside-link": { link: true, resolved: "../outside" },
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

test("rejects malformed optional peer metadata", () => {
  const error = validateLockfilePackageEntries({
    "node_modules/array-meta": {
      version: "1.0.0",
      peerDependencies: { optional: "1.0.0" },
      peerDependenciesMeta: [],
    },
    "node_modules/non-object": {
      version: "1.0.0",
      peerDependencies: { required: "1.0.0" },
      peerDependenciesMeta: { required: null },
    },
    "node_modules/wrong-type": {
      version: "1.0.0",
      peerDependencies: { required: "1.0.0" },
      peerDependenciesMeta: { required: { optional: "true" } },
    },
  });
  expect(error).toContain("node_modules/array-meta has invalid peerDependenciesMeta");
  expect(error).toContain(
    "node_modules/non-object has invalid peerDependenciesMeta entry required",
  );
  expect(error).toContain(
    "node_modules/wrong-type has invalid peerDependenciesMeta entry required",
  );
  expect(error).toContain("references missing dependency required");
});

test("accepts package metadata npm preserves without a matching peer dependency", () => {
  expect(
    validateLockfilePackageEntries({
      "node_modules/debug": {
        version: "4.4.3",
        peerDependenciesMeta: { "supports-color": { optional: true } },
      },
    }),
  ).toBeNull();
});
