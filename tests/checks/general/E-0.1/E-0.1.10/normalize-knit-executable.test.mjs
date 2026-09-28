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
  expect(normalizeKnitExecutable("\\\\build-share\\tools\\Program Files\\Git\\cmd\\git.exe")).toBe(
    "git",
  );
});

test("rejects unrecognized paths and commands", () => {
  for (const command of ["../npm", "/usr/bin/npm", "C:\\temp\\npm.cmd", "curl"]) {
    expect(normalizeKnitExecutable(command)).toBeNull();
  }
  expect(normalizeKnitExecutable(undefined)).toBeNull();
});
