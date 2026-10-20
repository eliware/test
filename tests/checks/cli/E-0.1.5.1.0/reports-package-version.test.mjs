import { expect, test } from "@jest/globals";
import { reportsPackageVersion } from "../../../../src/checks/cli/E-0.1.5.1.0/reports-package-version.mjs";

test.each([
  ["14.0.0", "14.0.0", true],
  ["release v14.0.0", "14.0.0", true],
  ["14.0.0 and 14.0.0", "14.0.0", true],
  ["14.0.0 and 14.0.1", "14.0.0", false],
  ["usage only", "14.0.0", false],
  ["14.0.0", undefined, false],
])("matches package version in output %j", (output, packageVersion, expected) => {
  expect(reportsPackageVersion(output, packageVersion)).toBe(expected);
});
