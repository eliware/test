import { expect, test } from "@jest/globals";
import { resolvePackExecutable } from "../../../../src/checks/npm-published/E-1.140/resolve-pack-executable.mjs";

test("resolves npm through npm_execpath or the platform executable", () => {
  expect(resolvePackExecutable({ npm_execpath: "npm-cli.js" }, "win32", "node.exe")).toEqual([
    "node.exe",
    ["npm-cli.js"],
  ]);
  expect(resolvePackExecutable({}, "win32", "node.exe")).toEqual(["npm.cmd", []]);
  expect(resolvePackExecutable({}, "linux", "node")).toEqual(["npm", []]);
});
