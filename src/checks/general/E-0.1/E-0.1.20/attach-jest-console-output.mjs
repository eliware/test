import { readFile } from "node:fs/promises";

export async function attachJestConsoleOutput(prepared, result, readConsoleReport = readFile) {
  try {
    const consoleOutput = JSON.parse(await readConsoleReport(prepared.consoleReportFile, "utf8"));
    return { ...result, consoleOutput };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const consoleReportError = `Could not read Jest's console output report: ${message}`;
    return {
      ...result,
      code: 1,
      stderr: [result.stderr, consoleReportError].filter(Boolean).join("\n"),
      consoleReportError,
    };
  }
}
