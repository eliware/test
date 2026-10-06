import { expect, test } from "@jest/globals";
import {
  hasWindowsNpmCommandOnPath,
  resolveWindowsNpmCliFromPath,
} from "../../src/orchestration/resolve-windows-npm-cli-from-path.mjs";

test("resolves the npm CLI beside an npm command on PATH", () => {
  const directory = "C:\\tools with spaces";
  const cli = `${directory}\\node_modules\\npm\\bin\\npm-cli.js`;
  const existing = new Set([`${directory}\\npm.cmd`, cli]);

  expect(
    resolveWindowsNpmCliFromPath(`;C:\\missing;"${directory}"`, (path) => existing.has(path)),
  ).toBe(cli);
});

test("normalizes quoted PATH entries with trailing separators and spaces", () => {
  const directory = "C:\\tools with spaces";
  const cli = `${directory}\\node_modules\\npm\\bin\\npm-cli.js`;
  const existing = new Set([`${directory}\\npm.cmd`, cli]);

  expect(resolveWindowsNpmCliFromPath(`"${directory}"\\   `, (path) => existing.has(path))).toBe(
    cli,
  );
});

test("skips PATH entries without both the command and its CLI", () => {
  expect(
    resolveWindowsNpmCliFromPath("C:\\npm-command-only;C:\\npm-cli-only", (path) =>
      path.endsWith("npm.cmd"),
    ),
  ).toBeUndefined();
  expect(resolveWindowsNpmCliFromPath(undefined, () => true)).toBeUndefined();
});

test("detects npm.cmd in quoted PATH directories with spaces", () => {
  expect(
    hasWindowsNpmCommandOnPath('"C:\\tools with spaces"', (path) => path.endsWith("\\npm.cmd")),
  ).toBe(true);
  expect(hasWindowsNpmCommandOnPath(undefined, () => true)).toBe(false);
  expect(hasWindowsNpmCommandOnPath("C:\\tools", undefined)).toBe(false);
});
