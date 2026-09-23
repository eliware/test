import { expect, test } from "@jest/globals";
import { readJsonCoverage } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-report-readers.mjs";

test("reads detailed reports and rejects summary-only reports", async () => {
  await expect(readJsonCoverage("coverage-final.json", "coverage-final.json", 0, async () => JSON.stringify({})))
    .resolves.toBeNull();
  await expect(readJsonCoverage("coverage-summary.json", "coverage-summary.json", 0, async () => JSON.stringify({
    total: { statements: { pct: 100, covered: 1, total: 1 }, branches: { pct: 100, covered: 1, total: 1 }, functions: { pct: 100, covered: 1, total: 1 }, lines: { pct: 100, covered: 1, total: 1 } },
  }))).rejects.toThrow("file-level coverage");
  let statCalls = 0;
  await expect(readJsonCoverage(
    "coverage-final.json",
    "coverage-final.json",
    1,
    async () => JSON.stringify({ "src/example.mjs": { s: { 0: 1 }, b: { 0: [1] }, f: { 0: 1 }, l: { 1: 1 }, statementMap: { 0: { start: { line: 1 } } }, branchMap: { 0: {} }, fnMap: { 0: {} } } }),
    async () => (statCalls++ === 0 ? null : { mtimeMs: 2 }),
  )).resolves.toMatchObject({ gaps: [], totals: { statements: 100, branches: 100, functions: 100, lines: 100 } });
  await expect(readJsonCoverage("missing-coverage.json", "missing-coverage.json", 0)).rejects.toThrow();
  await expect(readJsonCoverage("missing-coverage.json", "missing-coverage.json", 1)).rejects.toThrow();
  await expect(readJsonCoverage(
    "coverage-summary.json",
    "coverage-summary.json",
    1,
    async () => JSON.stringify({ total: {} }),
    async () => ({ mtimeMs: 2 }),
  )).rejects.toThrow("Summary-only coverage");
});

test("rejects a report replaced during the read", async () => {
  let reads = 0;
  await expect(readJsonCoverage(
    "coverage-final.json",
    "coverage-final.json",
    1,
    async () => (++reads === 1 ? JSON.stringify({}) : JSON.stringify({ changed: true })),
    async () => ({ mtimeMs: 2 }),
  )).rejects.toThrow("changed while being read");
});
