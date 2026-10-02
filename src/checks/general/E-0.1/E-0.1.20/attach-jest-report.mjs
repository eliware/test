import { readFile } from "node:fs/promises";

export async function attachJestReport(prepared, result, readReport = readFile) {
  try {
    const report = JSON.parse(await readReport(prepared.reportFile, "utf8"));
    const consoleOutput = JSON.parse(await readReport(prepared.consoleReportFile, "utf8"));
    return { ...result, report, consoleOutput };
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return { ...result, reportError: `Could not read Jest's structured result report: ${message}` };
  }
}
