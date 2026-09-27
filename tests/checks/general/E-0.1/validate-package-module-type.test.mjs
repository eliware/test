import { expect, test } from "@jest/globals";
import { validatePackageModuleType } from "../../../../src/checks/general/E-0.1/validate-package-module-type.mjs";

test("requires native ESM package metadata", () => {
  expect(validatePackageModuleType({ type: "module" })).toBeNull();
  expect(validatePackageModuleType({ type: "commonjs" })).toBe("package.json.type must be module.");
  expect(validatePackageModuleType({})).toBe("package.json.type must be module.");
});
