import { readFile } from "node:fs/promises";

export async function attachJestConsoleOutput(prepared, result, readConsoleReport = readFile) {
  try {
    const consoleOutput = JSON.parse(await readConsoleReport(prepared.consoleReportFile, "utf8"));
    return { ...result, consoleOutput };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return {
      ...result,
      consoleReportError: `Could not read Jest's console output report: ${message}`,
    };
  }
}
