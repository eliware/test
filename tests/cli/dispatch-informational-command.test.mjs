import { expect, test } from "@jest/globals";
import packageMetadata from "../../package.json" with { type: "json" };
import { dispatchInformationalCommand } from "../../src/cli/dispatch-informational-command.mjs";

test("dispatches version and help commands", () => {
  const output = [];
  expect(dispatchInformationalCommand(["--version"], (value) => output.push(value))).toBe(0);
  expect(output).toEqual([packageMetadata.version]);
  output.length = 0;
  expect(dispatchInformationalCommand(["--help"], (value) => output.push(value))).toBe(0);
  expect(output[0]).toContain("Usage: eliware-test");
  expect(output[0]).toContain("[focused-test-path ...]");
  expect(output[0]).toContain("pass one or more paths");
  expect(output[0]).toContain("tests/one.test.mjs tests/two.test.mjs");
  expect(output[0]).toContain(".js, .jsx, .ts, .tsx, .mjs, .cjs, .mts, and .cts");
  expect(output[0]).toContain("forwarded to Jest");
  expect(output[0]).toContain("mode arguments follow the mode or --");
  expect(output[0]).toContain("--debug-timing is wrapper-only");
  expect(output[0]).toContain("cannot follow --");
});

test("returns no result for validation commands", () => {
  expect(dispatchInformationalCommand([], () => {})).toBeNull();
});

test("owns informational conflict validation", () => {
  expect(() => dispatchInformationalCommand(["--help", "--help"], () => {})).toThrow(
    "cannot be repeated",
  );
  expect(() => dispatchInformationalCommand(["--help", "--lint"], () => {})).toThrow("combined");
});
