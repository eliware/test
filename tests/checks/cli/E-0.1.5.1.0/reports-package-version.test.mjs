import { expect, test } from "@jest/globals";
import { reportsPackageVersion } from "../../../../src/checks/cli/E-0.1.5.1.0/reports-package-version.mjs";

test.each([
  ["15.0.0", "15.0.0", true],
  ["release v15.0.0", "15.0.0", true],
  ["15.0.0 and 15.0.0", "15.0.0", true],
  ["15.0.0 and 15.0.1", "15.0.0", false],
  ["usage only", "15.0.0", false],
  ["15.0.0", undefined, false],
])("matches package version in output %j", (output, packageVersion, expected) => {
  expect(reportsPackageVersion(output, packageVersion)).toBe(expected);
});
