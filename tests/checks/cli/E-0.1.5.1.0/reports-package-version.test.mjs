import { expect, test } from "@jest/globals";
import { reportsPackageVersion } from "../../../../src/checks/cli/E-0.1.5.1.0/reports-package-version.mjs";

test.each([
  ["13.0.0", "13.0.0", true],
  ["release v13.0.0", "13.0.0", true],
  ["13.0.0 and 13.0.0", "13.0.0", true],
  ["13.0.0 and 13.0.1", "13.0.0", false],
  ["usage only", "13.0.0", false],
  ["13.0.0", undefined, false],
])("matches package version in output %j", (output, packageVersion, expected) => {
  expect(reportsPackageVersion(output, packageVersion)).toBe(expected);
});
