import { expect, test } from "@jest/globals";
import { npmCommand } from "../../src/checks/npm-command.mjs";

test("selects the platform npm executable or npm exec path", () => {
  expect(npmCommand("win32", "", "C:\\node.exe")).toEqual(["npm.cmd", []]);
  expect(npmCommand("linux", "")).toEqual(["npm", []]);
  expect(npmCommand("linux", "C:\\npm\\npm-cli.js")).toEqual([process.execPath, ["C:\\npm\\npm-cli.js"]]);
});
