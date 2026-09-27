import { expect, test } from "@jest/globals";
import { buildPackArguments } from "../../../../src/checks/npm-published/E-0.1.140/build-pack-arguments.mjs";

test("builds the dry-run JSON pack command", () => {
  expect(buildPackArguments()).toEqual(["pack", "--dry-run", "--json"]);
  expect(buildPackArguments(["--ignore-scripts"])).toEqual([
    "pack",
    "--ignore-scripts",
    "--dry-run",
    "--json",
  ]);
  expect(() => buildPackArguments(["--no-dry-run"])).toThrow("cannot override");
});
