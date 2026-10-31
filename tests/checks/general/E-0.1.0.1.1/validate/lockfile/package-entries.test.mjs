import { expect, test } from "@jest/globals";
import { validateLockfilePackageEntries } from "../../../../../../src/checks/general/E-0.1.0.1.1/validate/lockfile/package-entries.mjs";

test("skips the root entry and accepts valid dependency entries", () => {
  expect(
    validateLockfilePackageEntries({
      "": {},
      "node_modules/alpha": { version: "1.0.0", dependencies: { beta: "1.0.0" } },
      "node_modules/beta": { version: "1.0.0" },
    }),
  ).toBeNull();
});

test("reports invalid entry shapes and dependency reference errors", () => {
  const errors = validateLockfilePackageEntries({
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
