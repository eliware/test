import { expect, test } from "@jest/globals";
import { normalizeKnitExecutable } from "../../../../../src/checks/general/E-0.1/E-0.1.10/normalize-knit-executable.mjs";

test("normalizes allowlisted commands and standard Windows installation shims", () => {
  expect(normalizeKnitExecutable("npm.cmd")).toBe("npm");
  expect(normalizeKnitExecutable("C:\\Program Files\\nodejs\\npm.cmd")).toBe("npm");
  expect(normalizeKnitExecutable("C:\\Program Files (x86)\\nodejs\\npx.cmd")).toBe("npx");
  expect(normalizeKnitExecutable("C:\\Program Files\\Git\\cmd\\git.exe")).toBe("git");
  expect(normalizeKnitExecutable("C:\\Program Files\\Git\\bin\\git.exe")).toBe("git");
  expect(normalizeKnitExecutable("\\\\build-share\\tools\\Program Files\\nodejs\\npm.cmd")).toBe(
    "npm",
  );
  expect(normalizeKnitExecutable("\\\\build-share\\Program Files\\nodejs\\npm.cmd")).toBe("npm");
  expect(normalizeKnitExecutable("\\\\build-share\\tools\\Program Files\\Git\\cmd\\git.exe")).toBe(
    "git",
  );
});

test("rejects unrecognized executables and commands", () => {
  for (const command of [
    "../custom-npm",
    "/usr/bin/custom-npm",
    "C:\\temp\\curl.exe",
    "C:\\",
    "C:\\tools\\npm",
    "\\\\server\\",
    "\\\\server\\share\\..\\npm.cmd",
    "curl",
  ]) {
    expect(normalizeKnitExecutable(command)).toBeNull();
  }
  expect(normalizeKnitExecutable(undefined)).toBeNull();
});

test("accepts the npm shim under Program Files (x86)", () => {
  expect(normalizeKnitExecutable("C:\\Program Files (x86)\\nodejs\\npm.cmd")).toBe("npm");
});

test("accepts the current user's npm shim and rejects arbitrary absolute paths", () => {
  const userNpmShim = ["C:", "Users", "runner", "AppData", "Roaming", "npm", "npx.cmd"].join("\\");
  expect(normalizeKnitExecutable(userNpmShim)).toBe("npx");
  expect(normalizeKnitExecutable("D:\\tools\\node-v26\\npm.cmd")).toBeNull();
  expect(normalizeKnitExecutable("C:\\attacker\\npm.cmd")).toBeNull();
});
