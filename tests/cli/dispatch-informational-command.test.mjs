import { expect, test } from "@jest/globals";
import packageMetadata from "../../package.json" with { type: "json" };
import { dispatchInformationalCommand } from "../../src/cli/dispatch-informational-command.mjs";

test("dispatches version and help commands", () => {
  const output = [];
  expect(dispatchInformationalCommand(["--version"], (value) => output.push(value))).toBe(0);
  expect(output).toEqual([packageMetadata.version]);
  output.length = 0;
  expect(dispatchInformationalCommand(["--help"], (value) => output.push(value))).toBe(0);
  expect(output[0]).toContain("Usage:");
  expect(output[0]).toContain("<test-path> ... [-- Jest options]");
  expect(output[0]).toContain("Pass one or more repository-relative test paths in tests/");
  expect(output[0]).toContain(".js, .jsx, .ts, .tsx, .mjs, .cjs, .mts, .cts");
  expect(output[0]).toContain("Put supported Jest options after --.");
  expect(output[0]).toContain("--debug-timing shows elapsed times for each stage and check.");
  expect(output[0]).toContain("Both format modes use repository scope");
  expect(output[0]).toContain("Audit accepts --no-fund and --no-progress.");
  expect(output[0]).toContain("Pack accepts npm pack options");
  expect(output[0]).toContain("Do not put --debug-timing after --.");
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
