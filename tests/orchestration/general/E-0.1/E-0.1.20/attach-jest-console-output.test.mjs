import { expect, jest, test } from "@jest/globals";
import { attachJestConsoleOutput } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/attach-jest-console-output.mjs";

const prepared = { consoleReportFile: "console.json" };

test("attaches the parsed console report", async () => {
  const readReport = jest.fn().mockResolvedValueOnce('["console output"]');
  const result = await attachJestConsoleOutput(prepared, { code: 0 }, readReport);

  expect(result).toEqual({ code: 0, consoleOutput: ["console output"] });
  expect(readReport).toHaveBeenCalledWith("console.json", "utf8");
});

test("turns console report read and parse errors into diagnostics", async () => {
  const result = await attachJestConsoleOutput(prepared, { code: 0 }, () => {
    throw new Error("report unavailable");
  });
  expect(result.consoleReportError).toBe(
    "Could not read Jest's console output report: report unavailable",
  );

  const thrownValueResult = await attachJestConsoleOutput(prepared, { code: 0 }, () => {
    throw "invalid report";
  });
  expect(thrownValueResult.consoleReportError).toBe(
    "Could not read Jest's console output report: invalid report",
  );
});

test("uses the default report reader when no adapter is supplied", async () => {
  const result = await attachJestConsoleOutput(
    { consoleReportFile: "missing-console-report.json" },
    { code: 0 },
  );
  expect(result.consoleReportError).toContain("Could not read Jest's console output report:");
});
