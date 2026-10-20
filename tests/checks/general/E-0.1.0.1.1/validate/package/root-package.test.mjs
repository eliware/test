import { expect, test } from "@jest/globals";
import { packageVersion } from "../../../../../../test-fixtures/helpers/project-version.mjs";
import { validateLockfileRootPackage } from "../../../../../../src/checks/general/E-0.1.0.1.1/validate/package/root-package.mjs";

const packageJson = { name: "@eliware/example", version: packageVersion };
const rootPackage = { ...packageJson };

test("accepts matching dependency maps", () => {
  expect(validateLockfileRootPackage(packageJson, rootPackage, { "": rootPackage })).toEqual([]);
});
