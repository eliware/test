import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { readJsonCoverage } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-report-readers.mjs";
import { expectedCoverageShape } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-source-shapes.mjs";

test("reads detailed reports and rejects summary-only reports", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-reader-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "example.mjs"), "export const value = 1;\n");
  const source = "export function choose(value) { if (value) return 1; return 0; }\n";
  const filename = join(root, "src", "example.mjs");
  const shape = expectedCoverageShape(source, filename);
  const report = JSON.stringify({
    "src/example.mjs": {
      ...shape,
      s: Object.fromEntries(Object.keys(shape.statementMap).map((key) => [key, 1])),
      b: Object.fromEntries(
        Object.entries(shape.branchMap).map(([key, branch]) => [
          key,
          branch.locations.map(() => 1),
        ]),
      ),
      f: Object.fromEntries(Object.keys(shape.fnMap).map((key) => [key, 1])),
      l: Object.fromEntries(Object.keys(shape.lineMap).map((key) => [key, 1])),
    },
  });
  try {
    await expect(
      readJsonCoverage("coverage-final.json", "coverage-final.json", 0, async () =>
        JSON.stringify({}),
      ),
    ).resolves.toBeNull();
    await expect(
      readJsonCoverage("coverage-summary.json", "coverage-summary.json", 0, async () =>
        JSON.stringify({
          total: {
            statements: { pct: 100, covered: 1, total: 1 },
            branches: { pct: 100, covered: 1, total: 1 },
            functions: { pct: 100, covered: 1, total: 1 },
            lines: { pct: 100, covered: 1, total: 1 },
          },
        }),
      ),
    ).rejects.toThrow("file-level coverage");
    let statCalls = 0;
    await expect(
      readJsonCoverage(
        "coverage-final.json",
        "coverage-final.json",
        1,
        async () => report,
        async () => (statCalls++ === 0 ? null : { mtimeMs: 2 }),
        ["src/example.mjs"],
        { "src/example.mjs": shape },
      ),
    ).resolves.toMatchObject({
      gaps: [],
      totals: { statements: 100, branches: 100, functions: 100, lines: 100 },
    });
    await expect(
      readJsonCoverage("missing-coverage.json", "missing-coverage.json", 0),
    ).rejects.toThrow();
    await expect(
      readJsonCoverage("missing-coverage.json", "missing-coverage.json", 1),
    ).rejects.toThrow();
    await expect(
      readJsonCoverage(
        "coverage-summary.json",
        "coverage-summary.json",
        1,
        async () => JSON.stringify({ total: {} }),
        async () => ({ mtimeMs: 2 }),
      ),
    ).rejects.toThrow("Summary-only coverage");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects content replacement even when report metadata stays unchanged", async () => {
  let reads = 0;
  const statFile = jest.fn(async () => ({ mtimeMs: 2, size: 20, ino: 1 }));
  await expect(
    readJsonCoverage(
      "coverage-final.json",
      "coverage-final.json",
      1,
      async () => (++reads === 1 ? JSON.stringify({}) : JSON.stringify({ changed: true })),
      statFile,
    ),
  ).rejects.toThrow("changed while being read");
  expect(statFile).toHaveBeenCalledTimes(2);
});

test("accepts run-scoped coverage reports with same-millisecond timestamps", async () => {
  const report = JSON.stringify({});
  await expect(
    readJsonCoverage(
      "coverage-final.json",
      "coverage-final.json",
      100,
      async () => report,
      async () => ({ mtimeMs: 100 }),
      [],
      {},
      true,
    ),
  ).resolves.toBeNull();
});
