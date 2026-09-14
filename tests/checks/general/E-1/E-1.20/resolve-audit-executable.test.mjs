import { expect, test } from "@jest/globals";
import { resolveAuditExecutable } from "../../../../../src/checks/general/E-1/E-1.20/resolve-audit-executable.mjs";

test("selects npm executable variants", () => {
  expect(resolveAuditExecutable()).toEqual(expect.any(Array));
  expect(resolveAuditExecutable({ env: {}, platform: "linux", execPath: "/node" })).toEqual(["npm", []]);
  expect(resolveAuditExecutable({ env: {}, platform: "win32", execPath: "C:\\node.exe" })).toEqual([
    "npm.cmd",
    [],
  ]);
  expect(resolveAuditExecutable({ env: { npm_execpath: "C:\\npm-cli.js" }, platform: "win32", execPath: "node.exe" })).toEqual([
    "node.exe",
    ["C:\\npm-cli.js"],
  ]);
});
