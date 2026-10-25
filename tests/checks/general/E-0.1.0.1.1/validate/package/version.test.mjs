import { expect, test } from "@jest/globals";
import { bundledConventionVersion } from "../../../../../../src/validation/check-discovery/read/bundled-profile-catalog.mjs";
import { validatePackageVersion } from "../../../../../../src/checks/general/E-0.1.0.1.1/validate/package/version.mjs";
import { packageVersion } from "../../../../../../test-fixtures/helpers/project-version.mjs";

const error = `package.json.version must be numeric MAJOR.MINOR.PATCH for Convention v${bundledConventionVersion}.`;

test("accepts the current numeric package version", () => {
  expect(validatePackageVersion({ version: packageVersion })).toEqual([]);
});

test.each([undefined, "15.0", "15.0.01", "14.0.0", "15.0.0-beta"])(
  "rejects invalid package version %s",
  (version) => {
    expect(validatePackageVersion({ version })).toEqual([error]);
  },
);
