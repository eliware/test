import { expect, test } from "@jest/globals";
import { validateLockfilePackageEntries } from "../../../../src/checks/general/E-0.1.0.1.1/validate-lockfile-package-entries.mjs";

test("accepts dependency entries that resolve in the lockfile", () => {
  expect(
    validateLockfilePackageEntries({
      "": {},
      "node_modules/alpha": { version: "1.0.0", dependencies: { beta: "1.0.0" } },
      "node_modules/beta": { version: "1.0.0" },
    }),
  ).toBeNull();
});

test("reports invalid entry shapes and missing dependencies", () => {
  const errors = validateLockfilePackageEntries({
    "": {},
    "node_modules/bad": null,
    "node_modules/no-version": {},
    "node_modules/invalid": {
      version: "1",
      optionalDependencies: [],
      peerDependencies: { absent: "1" },
    },
  });
  expect(errors).toContain("node_modules/bad must be an object");
  expect(errors).toContain("node_modules/no-version must contain a package version");
  expect(errors).toContain("has invalid optionalDependencies");
  expect(errors).toContain("references missing dependency absent");
});

test("resolves dependency entries from nested package scopes", () => {
  expect(
    validateLockfilePackageEntries({
      "node_modules/parent": { version: "1.0.0", dependencies: { child: "1.0.0" } },
      "node_modules/parent/node_modules/child": { version: "1.0.0" },
    }),
  ).toBeNull();
});

test("allows an optional peer without a lockfile package entry", () => {
  expect(
    validateLockfilePackageEntries({
      "node_modules/parent": {
        version: "1",
        peerDependencies: { optional: "*" },
        peerDependenciesMeta: { optional: { optional: true } },
      },
    }),
  ).toBeNull();
});

test("requires a non-optional peer lockfile entry", () => {
  expect(
    validateLockfilePackageEntries({
      "node_modules/parent": { version: "1", peerDependencies: { required: "*" } },
    }),
  ).toContain("references missing dependency required");
});

test("rejects malformed dependency ranges in package entries", () => {
  expect(
    validateLockfilePackageEntries({
      "node_modules/parent": { version: "1", dependencies: { child: [] } },
      "node_modules/child": { version: "1" },
    }),
  ).toContain(
    "package-lock.json entry node_modules/parent has an invalid dependencies range for child.",
  );
});

test("requires transitive locked versions to satisfy dependency ranges", () => {
  expect(
    validateLockfilePackageEntries({
      "node_modules/parent": { version: "1.0.0", dependencies: { child: "^2.0.0" } },
      "node_modules/child": { version: "1.5.0" },
    }),
  ).toContain("dependency child does not satisfy its range");
});

test("rejects unsupported ranges and malformed optional peer metadata", () => {
  const errors = validateLockfilePackageEntries({
    "node_modules/parent": {
      version: "1.0.0",
      dependencies: { child: "file:../child" },
      peerDependencies: { optional: "*" },
      peerDependenciesMeta: { optional: [] },
    },
    "node_modules/child": { version: "1.0.0" },
  });
  expect(errors).toContain(
    "package-lock.json entry node_modules/parent has an unsupported dependencies range for child.",
  );
  expect(errors).toContain(
    "package-lock.json entry node_modules/parent references missing dependency optional.",
  );
});
