import { expect, test } from "@jest/globals";
import { extractPackageScriptCommands } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references/package-script/commands.mjs";

test("collects string script commands from a package manifest", () => {
  expect(
    extractPackageScriptCommands(
      JSON.stringify({ scripts: { test: "jest", lint: "oxlint", invalid: 1 } }),
    ),
  ).toEqual(["jest", "oxlint"]);
});

test("returns no commands for invalid or absent scripts", () => {
  expect(extractPackageScriptCommands("{")).toEqual([]);
  expect(extractPackageScriptCommands('{"name":"repo"}')).toEqual([]);
  expect(extractPackageScriptCommands('{"scripts":null}')).toEqual([]);
});
