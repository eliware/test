import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { readCoverageEvidenceFromCandidates } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-evidence-selection.mjs";

async function fixture(name, contents) {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await mkdir(join(root, "coverage"));
  await writeFile(join(root, "coverage", name), contents);
  return root;
}

test("rejects aggregate summary evidence", async () => {
  const root = await fixture(
    "coverage-summary.json",
    JSON.stringify({
      total: {
        statements: { pct: 100, covered: 1, total: 1 },
        branches: { pct: 99, covered: 99, total: 100 },
        functions: { pct: 100, covered: 1, total: 1 },
        lines: { pct: 100, covered: 1, total: 1 },
      },
    }),
  );
  await expect(readCoverageEvidenceFromCandidates(root)).rejects.toThrow("file-level coverage");
  await rm(root, { recursive: true, force: true });
});

test("rejects empty and omitted-only detailed reports", async () => {
  const root = await fixture("coverage-final.json", JSON.stringify({}));
  await expect(readCoverageEvidenceFromCandidates(root)).rejects.toThrow("invalid");
  await rm(root, { recursive: true, force: true });

  const omittedRoot = await mkdtemp(join(tmpdir(), "eliware-test-coverage-omitted-"));
  await mkdir(join(omittedRoot, "coverage"), { recursive: true });
  await mkdir(join(omittedRoot, "src"), { recursive: true });
  await writeFile(join(omittedRoot, "src", "expected.mjs"), "export const value = 1;\n");
  await writeFile(join(omittedRoot, "coverage", "coverage-final.json"), JSON.stringify({ "tests/only.test.mjs": {} }));
  await expect(readCoverageEvidenceFromCandidates(omittedRoot)).rejects.toThrow("src/expected.mjs");
  await rm(omittedRoot, { recursive: true, force: true });
});

test("requires fresh per-file evidence instead of accepting summary-only evidence", async () => {
  const root = await fixture(
    "coverage-summary.json",
    JSON.stringify({
      total: {
        statements: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
        lines: { pct: 100 },
      },
    }),
  );
  await expect(
    readCoverageEvidenceFromCandidates(root, "", 1, {
      requireFresh: true,
      statFile: async () => ({ mtimeMs: 2 }),
    }),
  ).rejects.toThrow("Coverage evidence is missing");
  await rm(root, { recursive: true, force: true });

  const textRoot = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await expect(
    readCoverageEvidenceFromCandidates(textRoot, "All files | 100 | 100 | 100 | 100 |\n"),
  ).rejects.toThrow("Coverage evidence is missing");
  await rm(textRoot, { recursive: true, force: true });

  const missingTimestampRoot = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await expect(
    readCoverageEvidenceFromCandidates(missingTimestampRoot, "", 0, { requireFresh: true }),
  ).rejects.toThrow("bound to the current Jest run");
  await rm(missingTimestampRoot, { recursive: true, force: true });
});

test("validates Jest text fallback, freshness, and file-level gaps", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  const text = [
    "File | % Stmts | % Branch | % Funcs | % Lines |",
    "src/example.mjs | 100 | 100 | 100 | 100 |",
    "All files | 100 | 100 | 100 | 100 |",
  ].join("\n");
  await expect(readCoverageEvidenceFromCandidates(root, text)).resolves.toMatchObject({
    source: "Jest text output",
    totals: { lines: 100 },
    gaps: [],
  });
  await rm(root, { recursive: true, force: true });

  const freshRoot = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  const freshText = "src/example.mjs | 100 | 100 | 100 | 100 |\nAll files | 100 | 100 | 100 | 100 |";
  await expect(
    readCoverageEvidenceFromCandidates(freshRoot, freshText, 1, { requireFresh: true }),
  ).rejects.toThrow("cannot prove freshness");
  await rm(freshRoot, { recursive: true, force: true });

  const gapsRoot = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  const gapText = ["src/example.mjs | 90 | 80 | 70 | 60 |", "All files | 90 | 80 | 70 | 60 |"].join(
    "\n",
  );
  await expect(readCoverageEvidenceFromCandidates(gapsRoot, gapText)).resolves.toMatchObject({
    source: "Jest text output",
    gaps: [
      {
        file: "src/example.mjs",
        metrics: { statements: 90, branches: 80, functions: 70, lines: 60 },
      },
    ],
  });
  await rm(gapsRoot, { recursive: true, force: true });
});

test("fails when the highest-priority summary is invalid", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await mkdir(join(root, "coverage"));
  await writeFile(join(root, "coverage", "coverage-summary.json"), JSON.stringify({ total: {} }));
  const detailed = {
    "src/example.mjs": {
      statementMap: { 0: { start: { line: 1 } } },
      s: { 0: 1 },
      branchMap: { 0: { locations: [{}] } },
      b: { 0: [1] },
      fnMap: { 0: {} },
      f: { 0: 1 },
      l: { 1: 1 },
    },
  };
  await writeFile(join(root, "coverage", "coverage.json"), JSON.stringify(detailed));
  await expect(readCoverageEvidenceFromCandidates(root)).rejects.toThrow(
    "coverage/coverage-summary.json",
  );
  await rm(root, { recursive: true, force: true });
  const rootReport = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await writeFile(join(rootReport, "coverage.json"), JSON.stringify(detailed));
  await expect(readCoverageEvidenceFromCandidates(rootReport)).resolves.toMatchObject({
    source: "coverage.json",
  });
  await rm(rootReport, { recursive: true, force: true });
});

test("skips an absent higher-priority detailed candidate and selects coverage.json", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await mkdir(join(root, "coverage"));
  const detailed = {
    "src/example.mjs": {
      statementMap: { 0: { start: { line: 1 } } }, branchMap: {}, fnMap: {},
      s: { 0: 1 }, b: {}, f: {}, l: { 1: 1 },
    },
  };
  await writeFile(join(root, "coverage", "coverage.json"), JSON.stringify(detailed));
  await expect(readCoverageEvidenceFromCandidates(root)).resolves.toMatchObject({ source: "coverage/coverage.json" });
  await rm(root, { recursive: true, force: true });
});

test("rejects stale evidence and invalid evidence without usable text", async () => {
  const root = await fixture("coverage-summary.json", JSON.stringify({ total: {} }));
  await expect(readCoverageEvidenceFromCandidates(root, "not a coverage table")).rejects.toThrow("file-level coverage");
  await writeFile(
    join(root, "coverage", "coverage-summary.json"),
    JSON.stringify({
      total: {
        statements: { pct: 100 },
        branches: { pct: 100 },
        functions: { pct: 100 },
        lines: { pct: 100 },
      },
    }),
  );
  await expect(readCoverageEvidenceFromCandidates(root, "", Date.now() + 60_000)).rejects.toThrow(
    "stale",
  );
  let summaryCalls = 0;
  await expect(
    readCoverageEvidenceFromCandidates(root, "", 1.5, {
      statFile: async (path) => {
        if (!path.endsWith("coverage-summary.json")) return { mtimeMs: 2 };
        return { mtimeMs: summaryCalls++ === 0 ? 1 : 1.4 };
      },
    }),
  ).rejects.toThrow("stale");
  await rm(root, { recursive: true, force: true });
});

test("reports malformed JSON and missing evidence when no fallback succeeds", async () => {
  const root = await fixture("coverage-summary.json", "not json");
  await expect(readCoverageEvidenceFromCandidates(root)).rejects.toThrow("Unexpected token");
  await rm(root, { recursive: true, force: true });
  const missingRoot = await mkdtemp(join(tmpdir(), "eliware-test-coverage-evidence-"));
  await expect(readCoverageEvidenceFromCandidates(missingRoot, "not a coverage table")).rejects.toThrow(
    "Coverage evidence is missing",
  );
  await rm(missingRoot, { recursive: true, force: true });
});
