import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { readJsonCoverage } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-report-readers.mjs";
import { readCoverageEvidenceFromCandidates } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-evidence-selection.mjs";

async function fixture(name, contents) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await mkdir(join(root, "coverage"));
  await writeFile(join(root, "coverage", name), contents);
  return root;
}

test("reads aggregate summary evidence", async () => {
  const root = await fixture("coverage-summary.json", JSON.stringify({ total: {
    statements: { pct: 100 }, branches: { pct: 99 }, functions: { pct: 100 }, lines: { pct: 100 },
  } }));
  await expect(readCoverageEvidenceFromCandidates(root)).resolves.toMatchObject({
    source: "coverage/coverage-summary.json",
    totals: { statements: 100, branches: 99, functions: 100, lines: 100 },
  });
  await rm(root, { recursive: true, force: true });
});

test("reads JSON with the default file dependencies", async () => {
  const root = await fixture("coverage-summary.json", JSON.stringify({ total: {
    statements: { pct: 100 }, branches: { pct: 100 }, functions: { pct: 100 }, lines: { pct: 100 },
  } }));
  await expect(readJsonCoverage(join(root, "coverage", "coverage-summary.json"), "coverage/coverage-summary.json", 0)).resolves.toMatchObject({
    totals: { lines: 100 },
  });
  await rm(root, { recursive: true, force: true });
});

test("reads detailed Istanbul evidence and identifies locations", async () => {
  const root = await fixture("coverage-final.json", JSON.stringify({ "src/example.mjs": {
    statementMap: { 0: { start: { line: 4, column: 0 } } }, s: { 0: 0 },
    branchMap: { 0: { locations: [{ start: { line: 6, column: 0 } }] } }, b: { 0: [0] },
    fnMap: { 0: { name: "example", start: { line: 8, column: 0 } } }, f: { 0: 0 },
  } }));
  await expect(readCoverageEvidenceFromCandidates(root)).resolves.toMatchObject({
    gaps: [{ file: "src/example.mjs", lines: ["4"], statements: [{ location: "4" }] }],
  });
  await rm(root, { recursive: true, force: true });
});

test("falls back to the Jest text summary", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await expect(readCoverageEvidenceFromCandidates(root, "All files | 100 | 100 | 100 | 100 |\n")).resolves.toMatchObject({
    source: "Jest text output", totals: { lines: 100 },
  });
  await rm(root, { recursive: true, force: true });
});

test("falls through invalid summaries to alternate JSON and root reports", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await mkdir(join(root, "coverage"));
  await writeFile(join(root, "coverage", "coverage-summary.json"), JSON.stringify({ total: {} }));
  await writeFile(join(root, "coverage", "coverage.json"), JSON.stringify({ "src/example.mjs": { s: { 0: 1 } } }));
  await expect(readCoverageEvidenceFromCandidates(root)).resolves.toMatchObject({ source: "coverage/coverage.json" });
  await rm(root, { recursive: true, force: true });
  const rootReport = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await writeFile(join(rootReport, "coverage.json"), JSON.stringify({ "src/example.mjs": { s: { 0: 1 } } }));
  await expect(readCoverageEvidenceFromCandidates(rootReport)).resolves.toMatchObject({ source: "coverage.json" });
  await rm(rootReport, { recursive: true, force: true });
});

test("rejects stale evidence and invalid evidence without usable text", async () => {
  const root = await fixture("coverage-summary.json", JSON.stringify({ total: {} }));
  await expect(readCoverageEvidenceFromCandidates(root, "not a coverage table")).rejects.toThrow("invalid");
  await writeFile(join(root, "coverage", "coverage-summary.json"), JSON.stringify({ total: {
    statements: { pct: 100 }, branches: { pct: 100 }, functions: { pct: 100 }, lines: { pct: 100 },
  } }));
  await expect(readCoverageEvidenceFromCandidates(root, "", Date.now() + 60_000)).rejects.toThrow("stale");
  let summaryCalls = 0;
  await expect(readCoverageEvidenceFromCandidates(root, "", 1.5, {
    statFile: async (path) => {
      if (!path.endsWith("coverage-summary.json")) return { mtimeMs: 2 };
      return { mtimeMs: summaryCalls++ === 0 ? 1 : 2 };
    },
  })).rejects.toThrow("stale");
  await rm(root, { recursive: true, force: true });
});

test("reports malformed coverage JSON when no fallback succeeds", async () => {
  const root = await fixture("coverage-summary.json", "not json");
  await expect(readCoverageEvidenceFromCandidates(root)).rejects.toThrow("Unexpected token");
  await rm(root, { recursive: true, force: true });
});

test("reports missing evidence when no report or text summary exists", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await expect(readCoverageEvidenceFromCandidates(root, "not a coverage table")).rejects.toThrow("Coverage evidence is missing");
  await rm(root, { recursive: true, force: true });
});
