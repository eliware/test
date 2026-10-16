import { expect, jest, test } from "@jest/globals";
import { createJestConsoleReport } from "../../../../../../../../src/validation/stages/jest/progress/create/jest/console/report.mjs";

test("captures suite paths and persists console records as JSON", () => {
  const writeFile = jest.fn();
  const report = createJestConsoleReport("report.json", writeFile);
  report.capture("tests/noisy.test.mjs", [
    { type: "warn", message: "unexpected output", origin: "line 4" },
  ]);
  report.persist();

  expect(writeFile).toHaveBeenCalledWith(
    "report.json",
    '[{"testFilePath":"tests/noisy.test.mjs","type":"warn","message":"unexpected output","origin":"line 4"}]',
    "utf8",
  );
});

test("does not write when no report path is configured", () => {
  const writeFile = jest.fn();
  createJestConsoleReport(undefined, writeFile).persist();
  expect(writeFile).not.toHaveBeenCalled();
});
