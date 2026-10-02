import { expect, test } from "@jest/globals";
import { resolve } from "node:path";
import { npmCommand } from "../../src/checks/npm-command.mjs";

test("selects the platform npm executable or npm exec path", () => {
  expect(npmCommand("linux", "")).toEqual(["npm", []]);
  expect(npmCommand("linux", "C:\\npm\\npm-cli.js")).toEqual([
    process.execPath,
    ["C:\\npm\\npm-cli.js"],
  ]);
  expect(npmCommand("linux", "/tools/npm-cli.js")).toEqual([
    process.execPath,
    ["/tools/npm-cli.js"],
  ]);
  expect(npmCommand("linux", "npm-cli.js", process.execPath, undefined, "/repo")).toEqual([
    process.execPath,
    [resolve("npm-cli.js")],
  ]);
  expect(npmCommand("win32", "", "C:\\node.exe", () => true)).toEqual([
    "C:\\node.exe",
    ["C:\\node_modules\\npm\\bin\\npm-cli.js"],
  ]);
  expect(npmCommand("win32", "C:\\npm\\npm-cli.js", "C:\\node.exe", () => true)).toEqual([
    "C:\\node.exe",
    ["C:\\npm\\npm-cli.js"],
  ]);
  expect(
    npmCommand("win32", "\\\\build-share\\tools\\npm-cli.js", "C:\\node.exe", () => true),
  ).toEqual(["C:\\node.exe", ["\\\\build-share\\tools\\npm-cli.js"]]);
  expect(
    npmCommand("win32", "C:relative\\npm-cli.js", "C:\\node.exe", () => true, "C:\\repo"),
  ).toEqual(["C:\\node.exe", ["C:\\repo\\relative\\npm-cli.js"]]);
  expect(
    npmCommand(
      "win32",
      "/usr/local/npm-cli.js",
      "C:\\node.exe",
      (path) => path === "C:\\node_modules\\npm\\bin\\npm-cli.js",
    ),
  ).toEqual(["C:\\node.exe", ["C:\\node_modules\\npm\\bin\\npm-cli.js"]]);
  expect(
    npmCommand(
      "win32",
      "C:\\stale\\npm-cli.js",
      "C:\\missing\\node.exe",
      (path) =>
        path === "C:\\tools\\npm.cmd" || path === "C:\\tools\\node_modules\\npm\\bin\\npm-cli.js",
      "C:\\repo",
      "C:\\tools",
    ),
  ).toEqual(["C:\\missing\\node.exe", ["C:\\tools\\node_modules\\npm\\bin\\npm-cli.js"]]);
  expect(() => npmCommand("win32", "", "C:\\missing\\node.exe", () => false)).toThrow(
    "Unable to resolve the npm CLI on Windows",
  );
});

test("uses platform defaults when no npm executable override is set", () => {
  const previous = process.env.npm_execpath;
  delete process.env.npm_execpath;
  try {
    if (process.platform === "win32") {
      expect(() => npmCommand(undefined, undefined, "C:\\missing\\node.exe", () => false)).toThrow(
        "Unable to resolve the npm CLI on Windows",
      );
    } else {
      expect(npmCommand(undefined, undefined, "C:\\missing\\node.exe")).toEqual(["npm", []]);
    }
  } finally {
    if (previous === undefined) delete process.env.npm_execpath;
    else process.env.npm_execpath = previous;
  }
});

test("resolves a relative Windows npm executable from the repository root", () => {
  expect(
    npmCommand(
      "win32",
      "node_modules/npm/bin/npm-cli.js",
      "C:\\node.exe",
      (path) => path === "C:\\repo\\node_modules\\npm\\bin\\npm-cli.js",
      "C:\\repo",
    ),
  ).toEqual(["C:\\node.exe", ["C:\\repo\\node_modules\\npm\\bin\\npm-cli.js"]]);
});
