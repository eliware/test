import { expect, jest, test } from "@jest/globals";
import { packageVersion } from "../../../../../../test-fixtures/helpers/project-version.mjs";
const readFile = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({
  readFile,
  default: readFile,
}));
const validatePackageLock = (
  await import("../../../../../../src/checks/general/E-0.1.0.1.1/validate/package/lock.mjs")
).default;
const pkg = {
  name: "@eliware/example",
  version: packageVersion,
};
const validLock = {
  name: pkg.name,
  version: pkg.version,
  lockfileVersion: 3,
  packages: {
    "": {
      name: pkg.name,
      version: pkg.version,
    },
  },
};
test("uses the mocked filesystem reader by default", async () => {
  const packageJson = {
    ...pkg,
    dependencies: {
      beta: "^1.0.0",
      alpha: "^1.0.0",
    },
  };
  const lockfile = {
    ...validLock,
    packages: {
      "": {
        ...validLock.packages[""],
        dependencies: {
          alpha: "^1.0.0",
          beta: "^1.0.0",
        },
      },
      "node_modules/alpha": {
        version: "1.0.0",
      },
      "node_modules/beta": {
        version: "1.0.0",
      },
    },
  };
  readFile.mockResolvedValue(JSON.stringify(lockfile));
  await expect(validatePackageLock("/repo", packageJson)).resolves.toEqual([]);
});
test("reports invalid transitive package entries", async () => {
  const lockfile = {
    ...validLock,
    packages: {
      ...validLock.packages,
      "node_modules/broken": null,
    },
  };
  await expect(
    validatePackageLock("/repo", pkg, { read: async () => JSON.stringify(lockfile) }),
  ).resolves.toContain("package-lock.json entry node_modules/broken must be an object.");
});
