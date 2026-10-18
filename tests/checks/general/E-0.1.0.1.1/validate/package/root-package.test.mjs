import { expect, test } from "@jest/globals";
import { packageVersion } from "../../../../../../test-fixtures/helpers/project-version.mjs";
import { validateLockfileRootPackage } from "../../../../../../src/checks/general/E-0.1.0.1.1/validate/package/root-package.mjs";

const packageJson = { name: "@eliware/example", version: packageVersion };
const rootPackage = { ...packageJson };

test("accepts matching package identity and dependency maps", () => {
  expect(validateLockfileRootPackage(packageJson, rootPackage, { "": rootPackage })).toEqual({
    matches: true,
    errors: [],
  });
});

test("reports mismatched root package identity", () => {
  expect(
    validateLockfileRootPackage(packageJson, { ...rootPackage, name: "@other/example" }, {}),
  ).toEqual({
    matches: false,
    errors: ["package-lock.json root package metadata must match package.json."],
  });
});
