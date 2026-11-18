import { expect, test } from "@jest/globals";
import findPackageScriptValidatorPaths from "../../../../../../src/checks/shared/package-scripts/validate/package-script-file-locations/find-package-script-validator-paths.mjs";

test("finds local validator scripts and ignores other commands", () => {
  expect(
    findPackageScriptValidatorPaths({
      scripts: {
        check: "node scripts/validate-package.mjs --strict",
        verify: "./scripts/preflight.ts",
        test: "jest",
        indirect: "npm run validate",
        nonValidator: "node scripts/helper.mjs",
        malformed: 42,
      },
    }),
  ).toEqual(["scripts/validate-package.mjs", "scripts/preflight.ts"]);
  expect(findPackageScriptValidatorPaths({ scripts: [] })).toEqual([]);
  expect(findPackageScriptValidatorPaths()).toEqual([]);
});
