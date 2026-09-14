import { expect, test } from "@jest/globals";
import { readJsonCoverage } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-report-readers.mjs";

test("reads detailed and summary report formats", async () => {
  await expect(readJsonCoverage("coverage-final.json", "coverage-final.json", 0, async () => JSON.stringify({})))
    .resolves.toEqual(expect.objectContaining({ gaps: [], totals: expect.any(Object) }));
  await expect(readJsonCoverage("coverage-summary.json", "coverage-summary.json", 0, async () => JSON.stringify({
    total: { statements: { pct: 100 }, branches: { pct: 100 }, functions: { pct: 100 }, lines: { pct: 100 } },
  }))).resolves.toEqual({ gaps: [], totals: { statements: 100, branches: 100, functions: 100, lines: 100 } });
});
