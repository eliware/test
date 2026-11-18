import { expect, test } from "@jest/globals";
import { packageVersion } from "../../../../../../test-fixtures/helpers/project-version.mjs";
import validateLockfileRootPackage from "../../../../../../src/checks/general/E-0.1.0.1.1/validate/package/root-package.mjs";
const packageJson = {
  name: "@eliware/example",
  version: packageVersion,
};
const rootPackage = {
  ...packageJson,
};
test("accepts matching dependency maps", () => {
  expect(
    validateLockfileRootPackage(packageJson, rootPackage, {
      "": rootPackage,
    }),
  ).toEqual([]);
});
test("rejects malformed dependency maps and ranges", () => {
  expect(
    validateLockfileRootPackage({ ...packageJson, dependencies: null }, rootPackage),
  ).toContain("package.json dependencies must be an object.");
  expect(validateLockfileRootPackage(packageJson, { ...rootPackage, dependencies: [] })).toContain(
    "package-lock.json root dependencies must be an object.",
  );
  expect(
    validateLockfileRootPackage(
      { ...packageJson, dependencies: { alpha: " " } },
      { ...rootPackage, dependencies: { beta: " " } },
    ),
  ).toEqual(
    expect.arrayContaining([
      "package.json dependencies has an invalid dependency range for alpha.",
      "package-lock.json root dependencies has an invalid dependency range for beta.",
      "package-lock.json root dependencies must match package.json.",
    ]),
  );
});
