import { expect, test } from "@jest/globals";
import { selectSmokeCliBin } from "../../../../../src/validation/stages/smoke/install-smoke-candidate/select-smoke-cli-bin.mjs";

test.each([
  [{ bin: "bin/cli.mjs" }, "bin/cli.mjs"],
  [{ bin: { cli: "bin/cli.mjs", other: "bin/other.mjs" } }, "bin/cli.mjs"],
  [{ bin: {} }, undefined],
  [{}, undefined],
])("selects a CLI target from package metadata", (packageJson, expected) => {
  expect(selectSmokeCliBin(packageJson)).toBe(expected);
});
