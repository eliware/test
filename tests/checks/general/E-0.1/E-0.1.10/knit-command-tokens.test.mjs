import { expect, test } from "@jest/globals";
import { commandTokens } from "../../../../../src/checks/general/E-0.1/E-0.1.10/knit-command-tokens.mjs";

test("converts only fully static command and argument strings to tokens", () => {
  expect(commandTokens({ command: "npm", args: ["test"] })).toEqual(["npm", "test"]);
  expect(commandTokens({ command: "npm", args: ["test", 1] })).toBeNull();
  expect(commandTokens({ command: 1, args: [] })).toBeNull();
  expect(commandTokens({ command: "npm", args: "test" })).toBeNull();
});

test.each(["exec", "execSync"])("rejects shell-command API %s", (kind) => {
  expect(commandTokens({ kind, command: "git pull", args: ["origin", "main"] })).toBeNull();
});
