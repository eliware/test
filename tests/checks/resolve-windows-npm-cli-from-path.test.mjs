import { expect, test } from "@jest/globals";
import { resolveWindowsNpmCliFromPath } from "../../src/checks/resolve-windows-npm-cli-from-path.mjs";

test("resolves the npm CLI beside an npm command on PATH", () => {
  const directory = "C:\\tools with spaces";
  const cli = `${directory}\\node_modules\\npm\\bin\\npm-cli.js`;
  const existing = new Set([`${directory}\\npm.cmd`, cli]);

  expect(
    resolveWindowsNpmCliFromPath(`;C:\\missing;"${directory}"`, (path) => existing.has(path)),
  ).toBe(cli);
});

test("skips PATH entries without both the command and its CLI", () => {
  expect(
    resolveWindowsNpmCliFromPath("C:\\npm-command-only;C:\\npm-cli-only", (path) =>
      path.endsWith("npm.cmd"),
    ),
  ).toBeUndefined();
  expect(resolveWindowsNpmCliFromPath(undefined, () => true)).toBeUndefined();
});
