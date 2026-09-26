import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, jest, test } from "@jest/globals";
import { readCoverageEvidenceFromCandidates } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/coverage-evidence-selection.mjs";
import { createRepositoryInventory } from "../../../../../../src/checks/create-repository-inventory.mjs";

const textReport = "src/example.mjs | 100 | 100 | 100 | 100 |\nAll files | 100 | 100 | 100 | 100 |";
const detailedReport = {
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

test("uses the shared coverage-source view and cached source text", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-inventory-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "expected.mjs"), "export const value = 1;\n");
  const repositoryInventory = createRepositoryInventory(root);
  try {
    await expect(
      readCoverageEvidenceFromCandidates(root, "", 0, { inventory: repositoryInventory }),
    ).rejects.toThrow("Coverage evidence is missing");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("returns the first valid detailed candidate with its selected path", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-selection-"));
  await mkdir(join(root, "coverage"));
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

test("reads the run-local reporter filenames inside isolated coverage output", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-run-local-coverage-"));
  const coverageDirectory = join(root, "isolated-output");
  await mkdir(join(root, "src"));
  await mkdir(coverageDirectory);
  await writeFile(join(root, "src", "example.mjs"), "export const value = 1;\n");
  const simpleReport = structuredClone(detailedReport);
  Object.assign(simpleReport["src/example.mjs"], { branchMap: {}, b: {}, fnMap: {}, f: {} });
  await writeFile(join(coverageDirectory, "coverage-final.json"), JSON.stringify(simpleReport));
  try {
    await expect(readCoverageEvidenceFromCandidates(root, "", 1, {
      coverageDirectory,
      expectedFiles: ["src/example.mjs"],
    })).resolves.toMatchObject({ source: "coverage-final.json", gaps: [] });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reads isolated run reports through the injected inventory reader", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-inventory-coverage-reader-"));
  const coverageDirectory = join(root, "reports-that-do-not-exist");
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "example.mjs"), "export const value = 1;\n");
  const simpleReport = structuredClone(detailedReport);
  Object.assign(simpleReport["src/example.mjs"], { branchMap: {}, b: {}, fnMap: {}, f: {} });
  const read = jest.fn(async (path) => path.endsWith("coverage-final.json")
    ? JSON.stringify(simpleReport)
    : readFile(path));
  const inventory = createRepositoryInventory(root, { read });
  try {
    await expect(readCoverageEvidenceFromCandidates(root, "", 0, {
      inventory,
      coverageDirectory,
      expectedFiles: ["src/example.mjs"],
    })).resolves.toMatchObject({ source: "coverage-final.json", gaps: [] });
    expect(read).toHaveBeenCalledWith(join(coverageDirectory, "coverage-final.json"));
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
    await expect(readCoverageEvidenceFromCandidates(root, textReport, 1, { requireFresh: true }))
      .rejects.toThrow("cannot prove freshness");
    await expect(readCoverageEvidenceFromCandidates(root, "not a report")).rejects.toThrow(
      "Coverage evidence is missing",
    );
    await expect(readCoverageEvidenceFromCandidates(root, "", 0, { requireFresh: true }))
      .rejects.toThrow("bound to the current Jest run");
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("skips a stale higher-priority report and selects a fresh later report", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-fresh-selection-"));
  await mkdir(join(root, "coverage"));
  await writeFile(join(root, "coverage", "coverage-final.json"), JSON.stringify(detailedReport));
  await writeFile(join(root, "coverage", "coverage.json"), JSON.stringify(detailedReport));
  try {
    await expect(readCoverageEvidenceFromCandidates(root, "", 1, {
      requireFresh: true,
      expectedFiles: [],
      statFile: async (path) => ({ mtimeMs: path.endsWith("coverage-final.json") ? 0 : 2 }),
    })).resolves.toMatchObject({ source: "coverage/coverage.json" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
