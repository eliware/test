import { expect, test } from "@jest/globals";
import {
  findPackageScriptValidatorPaths,
  validatePackageScriptFileLocations,
} from "../../../../../src/checks/shared/package-scripts/validate/package-script-file-locations.mjs";

test.each([
  "node src/validate.mjs",
  "./tools/validate.js",
  "python ../checks/validate.py",
  "node src/preflight-task.mjs",
  "node tools/custom-validator.mjs",
])("rejects a direct local validator outside scripts/: %s", (command) => {
  expect(validatePackageScriptFileLocations({ scripts: { validate: command } })).toEqual([
    "package.json.scripts.validate must keep local validator files under scripts/.",
  ]);
});

test.each([
  "node scripts/validate.mjs",
  "node ./scripts/validate.mjs",
  "node bin/eliware-test.mjs",
])("allows a local script under an approved directory: %s", (command) => {
  expect(validatePackageScriptFileLocations({ scripts: { validate: command } })).toEqual([]);
});

test("allows installed tools and does not parse shell-wrapped commands", () => {
  expect(
    validatePackageScriptFileLocations({
      scripts: {
        preflight: "vyops preflight config.boot",
        validate: "netdoc --validate",
        wrapped: 'bash -c "node ./src/validate.mjs"',
        smoke: "node src/validation/stages/smoke/cli.mjs",
      },
    }),
  ).toEqual([]);
});

test("does not require scripts or scan files in the scripts directory", () => {
  expect(findPackageScriptValidatorPaths()).toEqual([]);
  expect(validatePackageScriptFileLocations({ scripts: { release: "semantic-release" } })).toEqual(
    [],
  );
  expect(validatePackageScriptFileLocations({})).toEqual([]);
  expect(validatePackageScriptFileLocations({ scripts: [] })).toEqual([]);
  expect(validatePackageScriptFileLocations({ scripts: { validate: 1 } })).toEqual([]);
});
