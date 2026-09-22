import { expect, test } from "@jest/globals";
import { dispatchInformationalCommand } from "../../src/cli/dispatch-informational-command.mjs";

test("dispatches version and help commands", () => {
  const output = [];
  expect(dispatchInformationalCommand(["--version"], (value) => output.push(value))).toBe(0);
  expect(output).toEqual(["8.0.0"]);
  output.length = 0;
  expect(dispatchInformationalCommand(["--help"], (value) => output.push(value))).toBe(0);
  expect(output[0]).toContain("Usage: eliware-test");
});

test("returns no result for validation commands", () => {
  expect(dispatchInformationalCommand([], () => {})).toBeNull();
});

test("owns informational conflict validation", () => {
  expect(() => dispatchInformationalCommand(["--help", "--help"], () => {})).toThrow("cannot be repeated");
  expect(() => dispatchInformationalCommand(["--help", "--lint"], () => {})).toThrow("combined");
});
