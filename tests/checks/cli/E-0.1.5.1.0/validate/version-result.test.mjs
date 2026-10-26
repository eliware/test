import { expect, test } from "@jest/globals";
import { packageVersion } from "../../../../../test-fixtures/helpers/project-version.mjs";
import { validateCliVersionResult } from "../../../../../src/checks/cli/E-0.1.5.1.0/validate/version-result.mjs";

test("accepts repeated occurrences of the same package version", () => {
  expect(validateCliVersionResult("bin/cli.mjs", "15.0.0 and v15.0.0", "15.0.0")).toEqual([]);
});

test("accepts output that reports only the package version", () => {
  expect(
    validateCliVersionResult("bin/cli.mjs", `Eliware CLI v${packageVersion}`, packageVersion),
  ).toEqual([]);
});

test("reports version mismatches and missing package versions", () => {
  expect(validateCliVersionResult("bin/cli.mjs", "wrong", packageVersion)).toEqual([
    `CLI entrypoint bin/cli.mjs --version must report package version ${packageVersion}.`,
  ]);
  expect(validateCliVersionResult("bin/cli.mjs", "1.0.0", undefined)).toEqual([
    "CLI entrypoint bin/cli.mjs --version must report package version undefined.",
  ]);
});
