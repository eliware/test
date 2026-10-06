import { expect, test } from "@jest/globals";
import { buildNpmScriptArguments } from "../../src/orchestration/build-npm-script-arguments.mjs";

test("builds an isolated npm script invocation", () => {
  expect(buildNpmScriptArguments("build")).toEqual(["run", "build", "--silent"]);
});
