import { expect, test } from "@jest/globals";
import { packageVersion } from "../../../../../../test-fixtures/helpers/project-version.mjs";
import { validateLockfileMetadata } from "../../../../../../src/checks/general/E-0.1.0.1.1/validate/package/lock-metadata.mjs";

const packageJson = { name: "@eliware/example", version: packageVersion };
const validLock = {
  name: packageJson.name,
  version: packageJson.version,
  lockfileVersion: 3,
  packages: { "": { ...packageJson } },
};

test("returns the root package when lockfile metadata matches", () => {
  expect(validateLockfileMetadata(validLock, packageJson)).toEqual({
    errors: [],
    rootPackage: validLock.packages[""],
  });
});

test("rejects non-object lock data", () => {
  expect(validateLockfileMetadata(null, packageJson).errors).toEqual([
    "package-lock.json must contain a JSON object.",
  ]);
});

test("rejects a lockfile identity mismatch", () => {
  expect(
    validateLockfileMetadata({ ...validLock, name: "@other/example" }, packageJson).errors,
  ).toEqual(["package-lock.json name and version must match package.json."]);
});

test("requires lockfile version 3", () => {
  expect(
    validateLockfileMetadata({ ...validLock, lockfileVersion: 2 }, packageJson).errors,
  ).toEqual(["package-lock.json must use lockfile version 3."]);
});

test("requires a packages object and root entry", () => {
  expect(validateLockfileMetadata({ ...validLock, packages: [] }, packageJson).errors).toEqual([
    "package-lock.json must contain a packages object and root entry.",
  ]);
});

test("rejects root package identity differences", () => {
  const lockfile = {
    ...validLock,
    packages: { "": { name: "@other/example", version: packageVersion } },
  };
  expect(validateLockfileMetadata(lockfile, packageJson).errors).toEqual([
    "package-lock.json root package metadata must match package.json.",
  ]);
});
