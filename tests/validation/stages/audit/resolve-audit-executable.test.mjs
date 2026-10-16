import { expect, test } from "@jest/globals";
import { join } from "node:path";
import { resolveAuditExecutable } from "../../../../src/validation/stages/audit/resolve-audit-executable.mjs";

test("selects npm executable variants", () => {
  expect(resolveAuditExecutable()).toEqual(expect.any(Array));
  expect(resolveAuditExecutable({ env: {}, platform: "linux", execPath: "/node" })).toEqual([
    "npm",
    [],
  ]);
  expect(() =>
    resolveAuditExecutable({ env: { PATH: "" }, platform: "win32", execPath: "C:\\node.exe" }),
  ).toThrow("Cannot resolve the npm CLI on Windows");
  expect(
    resolveAuditExecutable({
      env: { npm_execpath: "npm-cli.js" },
      platform: "linux",
      execPath: process.execPath,
      root: "C:/repo",
    }),
  ).toEqual([process.execPath, [join("C:/repo", "npm-cli.js")]]);
});
