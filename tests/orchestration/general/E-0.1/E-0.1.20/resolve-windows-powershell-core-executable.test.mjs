import { expect, test } from "@jest/globals";
import { resolveWindowsPowerShellCoreExecutable } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/resolve-windows-powershell-core-executable.mjs";

test("resolves PowerShell Core from PATH before its standard installation directory", () => {
  expect(
    resolveWindowsPowerShellCoreExecutable(
      {
        Path: "C:\\Tools;C:\\Windows\\System32",
        ProgramFiles: "C:\\Program Files",
      },
      (candidate) => candidate === "C:\\Tools\\pwsh.exe",
    ),
  ).toBe("C:\\Tools\\pwsh.exe");
});

test("overrides the existing PATH key without changing its casing", () => {
  const pathKey = Object.keys(process.env).find((key) => key.toLowerCase() === "path") ?? "PATH";
  expect(
    resolveWindowsPowerShellCoreExecutable(
      { [pathKey]: "C:\\Tools" },
      (candidate) => candidate === "C:\\Tools\\pwsh.exe",
    ),
  ).toBe("C:\\Tools\\pwsh.exe");
});

test("resolves PowerShell Core from Program Files when it is absent from PATH", () => {
  expect(
    resolveWindowsPowerShellCoreExecutable(
      { ProgramFiles: "C:\\Program Files" },
      (candidate) => candidate === "C:\\Program Files\\PowerShell\\7\\pwsh.exe",
    ),
  ).toBe("C:\\Program Files\\PowerShell\\7\\pwsh.exe");
});

test("reports when PowerShell Core cannot be located", () => {
  expect(() => resolveWindowsPowerShellCoreExecutable({ Path: ".;relative\\bin" })).toThrow(
    "not found on PATH or in the standard Program Files location",
  );
});

test("handles an environment with no PATH entry", () => {
  const originalPathEntries = Object.entries(process.env).filter(
    ([key]) => key.toLowerCase() === "path",
  );
  for (const [key] of originalPathEntries) delete process.env[key];
  try {
    expect(() => resolveWindowsPowerShellCoreExecutable({})).toThrow(
      "not found on PATH or in the standard Program Files location",
    );
  } finally {
    for (const [key, value] of originalPathEntries) process.env[key] = value;
  }
});
