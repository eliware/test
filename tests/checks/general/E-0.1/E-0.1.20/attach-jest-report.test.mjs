import { expect, jest, test } from "@jest/globals";
import { attachJestReport } from "../../../../../src/checks/general/E-0.1/E-0.1.20/attach-jest-report.mjs";

const prepared = { reportFile: "report.json", consoleReportFile: "console.json" };

test("attaches the parsed structured and console reports", async () => {
  const readReport = jest
    .fn()
    .mockResolvedValueOnce('{"testResults":[]}')
    .mockResolvedValueOnce('["console output"]');
  const result = await attachJestReport(prepared, { code: 0 }, readReport);

  expect(result).toEqual({
    code: 0,
    report: { testResults: [] },
    consoleOutput: ["console output"],
  });
  expect(readReport).toHaveBeenNthCalledWith(1, "report.json", "utf8");
  expect(readReport).toHaveBeenNthCalledWith(2, "console.json", "utf8");
});

test("turns report read and parse errors into a diagnostic", async () => {
  const errorResult = await attachJestReport(prepared, { code: 0 }, () => {
    throw new Error("report unavailable");
  });
  expect(errorResult.reportError).toBe(
    "Could not read Jest's structured result report: report unavailable",
  );

  const thrownValueResult = await attachJestReport(prepared, { code: 0 }, () => {
    throw "invalid report";
  });
  expect(thrownValueResult.reportError).toBe(
    "Could not read Jest's structured result report: invalid report",
  );
});

test("uses the default report reader when no adapter is supplied", async () => {
  const result = await attachJestReport(
    { ...prepared, reportFile: "missing-jest-report.json" },
    { code: 0 },
  );
  expect(result.reportError).toContain("Could not read Jest's structured result report:");
});
