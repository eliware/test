import { expect, test } from "@jest/globals";
import { buildPackArguments } from "../../../../src/checks/npm-published/E-1.140/build-pack-arguments.mjs";

test("builds the dry-run JSON pack command", () => {
  expect(buildPackArguments()).toEqual(["pack", "--dry-run", "--json"]);
});
