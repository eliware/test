import { expect, test } from "@jest/globals";
import { reportsPackageVersion } from "../../../../src/checks/cli/E-0.1.5.1.0/reports-package-version.mjs";

test("accepts repeated occurrences of the same package version", () => {
  expect(reportsPackageVersion("15.0.0 and v15.0.0", "15.0.0")).toBe(true);
});
