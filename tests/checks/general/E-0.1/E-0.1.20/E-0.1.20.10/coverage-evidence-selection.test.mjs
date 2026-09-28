import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, sep } from "node:path";
import { expect, test } from "@jest/globals";
import { readCoverageEvidenceFromCandidates } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-evidence-selection.mjs";
import { expectedCoverageShape } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-source-shapes.mjs";

const textReport = "src/example.mjs | 100 | 100 | 100 | 100 |\nAll files | 100 | 100 | 100 | 100 |";
const exampleSource = "export const value = 1;\n";
const exampleShape = expectedCoverageShape(exampleSource, "src/example.mjs");
const detailedReport = {
  "src/example.mjs": {
    ...exampleShape,
    s: Object.fromEntries(Object.keys(exampleShape.statementMap).map((key) => [key, 1])),
    b: {},
    f: {},
    l: Object.fromEntries(Object.keys(exampleShape.lineMap).map((key) => [key, 1])),
  },
};

test("returns the first valid detailed candidate with its selected path", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-selection-"));
  await mkdir(join(root, "coverage"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "example.mjs"), exampleSource);
  await writeFile(join(root, "README.md"), "coverage fixture\n");
  await writeFile(join(root, "coverage", "coverage-final.json"), JSON.stringify(detailedReport));
  try {
    await expect(readCoverageEvidenceFromCandidates(root)).resolves.toMatchObject({
      source: "coverage/coverage-final.json",
      gaps: [],
    });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("falls back after a detailed report has malformed source-derived line counters", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-malformed-coverage-fallback-"));
  const coverageDirectory = join(root, "coverage");
  await mkdir(join(root, "src"));
  await mkdir(coverageDirectory);
  await writeFile(join(root, "src", "example.mjs"), exampleSource);
  const malformedReport = structuredClone(detailedReport);
  malformedReport["src/example.mjs"].l = { 2: 1 };
  const validReport = structuredClone(detailedReport);
  Object.assign(validReport["src/example.mjs"], { branchMap: {}, b: {}, fnMap: {}, f: {} });
  await writeFile(join(coverageDirectory, "coverage-final.json"), JSON.stringify(malformedReport));
  await writeFile(join(coverageDirectory, "coverage.json"), JSON.stringify(validReport));
  try {
    await expect(
      readCoverageEvidenceFromCandidates(root, "", 0, {
        coverageDirectory,
        expectedFiles: ["src/example.mjs"],
      }),
    ).resolves.toMatchObject({ source: "coverage.json", gaps: [] });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads the run-local reporter filenames inside isolated coverage output", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-run-local-coverage-"));
  const coverageDirectory = join(root, "isolated-output");
  await mkdir(join(root, "src"));
  await mkdir(coverageDirectory);
  await writeFile(join(root, "src", "example.mjs"), exampleSource);
  const simpleReport = structuredClone(detailedReport);
  Object.assign(simpleReport["src/example.mjs"], { branchMap: {}, b: {}, fnMap: {}, f: {} });
  await writeFile(join(coverageDirectory, "coverage-final.json"), JSON.stringify(simpleReport));
  try {
    await expect(
      readCoverageEvidenceFromCandidates(root, "", 1, {
        coverageDirectory,
        expectedFiles: ["src/example.mjs"],
      }),
    ).resolves.toMatchObject({ source: "coverage-final.json", gaps: [] });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("falls back to text evidence only when detailed evidence is not required", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-text-fallback-"));
  try {
    await mkdir(join(root, "src"));
    await writeFile(join(root, "src", "example.mjs"), "export const value = 1;\n");
    await expect(readCoverageEvidenceFromCandidates(root, textReport)).resolves.toMatchObject({
      source: "Jest text output",
      gaps: [],
    });
    await expect(
      readCoverageEvidenceFromCandidates(root, textReport, 1, { requireFresh: true }),
    ).rejects.toThrow("cannot prove freshness");
    await expect(readCoverageEvidenceFromCandidates(root, "not a report")).rejects.toThrow(
      "Coverage evidence is missing",
    );
    await expect(
      readCoverageEvidenceFromCandidates(root, "", 0, { requireFresh: true }),
    ).rejects.toThrow("bound to the current Jest run");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("skips a stale higher-priority report and selects a fresh later report", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-fresh-selection-"));
  await mkdir(join(root, "coverage"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "example.mjs"), "export const value = 1;\n");
  await writeFile(join(root, "coverage", "coverage-final.json"), JSON.stringify(detailedReport));
  await writeFile(join(root, "coverage", "coverage.json"), JSON.stringify(detailedReport));
  try {
    await expect(
      readCoverageEvidenceFromCandidates(root, "", 1, {
        requireFresh: true,
        expectedFiles: ["src/example.mjs"],
        statFile: async (path) => ({ mtimeMs: path.endsWith("coverage-final.json") ? 0 : 2 }),
      }),
    ).resolves.toMatchObject({ source: "coverage/coverage.json" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("requires fresh detailed reports to match source-derived coverage shape", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-source-shaped-coverage-"));
  const coverageDirectory = join(root, "coverage");
  const sourceDirectory = join(root, "src");
  const sourcePath = join(sourceDirectory, "example.mjs");
  const source = "export function choose(value) { if (value) return 'yes'; return 'no'; }\n";
  const startedAt = Date.now() - 5000;
  await mkdir(sourceDirectory);
  await mkdir(coverageDirectory);
  await writeFile(sourcePath, source);

  const shape = expectedCoverageShape(source, sourcePath.split(sep).join("/"));
  const completeReport = {
    ...shape,
    s: Object.fromEntries(Object.keys(shape.statementMap).map((key) => [key, 1])),
    b: Object.fromEntries(
      Object.entries(shape.branchMap).map(([key, branch]) => [key, branch.locations.map(() => 1)]),
    ),
    f: Object.fromEntries(Object.keys(shape.fnMap).map((key) => [key, 1])),
    l: Object.fromEntries(Object.keys(shape.lineMap).map((key) => [key, 1])),
  };
  const reportPath = join(coverageDirectory, "coverage-final.json");
  try {
    await writeFile(
      reportPath,
      JSON.stringify({ [sourcePath.split(sep).join("/")]: completeReport }),
    );
    await expect(
      readCoverageEvidenceFromCandidates(root, "", startedAt, { requireFresh: true }),
    ).resolves.toMatchObject({ gaps: [] });

    await writeFile(reportPath, JSON.stringify({}));
    await expect(
      readCoverageEvidenceFromCandidates(root, "", startedAt, { requireFresh: true }),
    ).rejects.toThrow("omits in-scope source file");

    await writeFile(
      reportPath,
      JSON.stringify({ [sourcePath.split(sep).join("/")]: completeReport }),
    );
    await expect(
      readCoverageEvidenceFromCandidates(root, "", Date.now() + 5000, { requireFresh: true }),
    ).rejects.toThrow("stale or changed");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
