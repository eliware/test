import { expect, test } from "@jest/globals";
import { selectNpmCommand } from "../../../../../src/checks/general/E-1/E-1.20/select-npm-command.mjs";

test("selects npm through npm_execpath when supplied", () => {
  expect(selectNpmCommand({ env: { npm_execpath: "/npm-cli.js" }, platform: "linux", execPath: "/node" })).toEqual([
    "/node", ["/npm-cli.js"],
  ]);
});

test("selects the Windows npm launcher or PATH npm", () => {
  expect(selectNpmCommand({ env: {}, platform: "win32", execPath: "C:\\node.exe" })).toEqual([
    "C:\\node.exe",
    ["C:\\node_modules\\npm\\bin\\npm-cli.js"],
  ]);
  expect(selectNpmCommand({ env: {}, platform: "linux", execPath: "/node" })).toEqual(["npm", []]);
});
