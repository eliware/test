import { expect, test } from "@jest/globals";
import { npmCommand } from "../../src/checks/npm-command.mjs";

test("selects the platform npm executable or npm exec path", () => {
  expect(npmCommand("linux", "")).toEqual(["npm", []]);
  expect(npmCommand("linux", "C:\\npm\\npm-cli.js")).toEqual([process.execPath, ["C:\\npm\\npm-cli.js"]]);
  expect(npmCommand("win32", "", "C:\\node.exe", () => true)).toEqual([
    "C:\\node.exe", ["C:\\node_modules\\npm\\bin\\npm-cli.js"],
  ]);
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
