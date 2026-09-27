import { expect, test } from "@jest/globals";
import { validatePackageScripts } from "../../../../src/checks/general/E-0.1/validate-package-scripts.mjs";

test("requires a nonempty script object with nonempty string commands", () => {
  const error = "package.json.scripts must be a nonempty object of nonempty strings.";
  expect(validatePackageScripts({ scripts: { test: "npm test" } })).toBeNull();
  expect(validatePackageScripts({})).toBe(error);
  expect(validatePackageScripts({ scripts: [] })).toBe(error);
  expect(validatePackageScripts({ scripts: {} })).toBe(error);
  expect(validatePackageScripts({ scripts: { test: " " } })).toBe(error);
  expect(validatePackageScripts({ scripts: { test: 1 } })).toBe(error);
});
