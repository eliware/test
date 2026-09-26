import { expect, jest, test } from "@jest/globals";
import { selectCoverageEvidence } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/select-coverage-evidence.mjs";

const text = "src/example.mjs | 100 | 100 | 100 | 100 |\nAll files | 100 | 100 | 100 | 100 |";

test("uses candidate order and skips summary reports when fresh evidence is required", async () => {
  const readCandidate = jest.fn(async (path) => {
    if (path.endsWith("coverage-final.json"))
      throw Object.assign(new Error("missing"), { code: "ENOENT" });
    return { totals: { lines: 100 }, gaps: [] };
  });
  const evidence = await selectCoverageEvidence(
    ["coverage/coverage-final.json", "coverage/coverage-summary.json", "coverage/coverage.json"],
    readCandidate,
    "",
    true,
  );

  expect(evidence).toEqual({ totals: { lines: 100 }, gaps: [], source: "coverage/coverage.json" });
  expect(readCandidate.mock.calls.map(([path]) => path)).toEqual([
    "coverage/coverage-final.json",
    "coverage/coverage.json",
  ]);
});

test("keeps searching after unusable reports and reports the last unusable report", async () => {
  const readCandidate = jest.fn(async (path) => {
    if (path === "syntax.json") throw new SyntaxError("bad JSON");
    throw new Error(`Coverage report is invalid: ${path}`);
  });
  await expect(
    selectCoverageEvidence(["syntax.json", "invalid.json"], readCandidate),
  ).rejects.toThrow("Coverage report is invalid: invalid.json");
});

test("continues after a report omits source entries and selects a later valid report", async () => {
  const readCandidate = jest.fn(async (path) => {
    if (path === "first.json") {
      throw new Error(
        "Coverage report does not account for every source branch path in src/example.mjs.",
      );
    }
    return { totals: { lines: 100 }, gaps: [] };
  });
  await expect(
    selectCoverageEvidence(["first.json", "later.json"], readCandidate),
  ).resolves.toEqual({
    totals: { lines: 100 },
    gaps: [],
    source: "later.json",
  });
  expect(readCandidate).toHaveBeenCalledTimes(2);
});

test("continues after detailed coverage validation rejects a candidate", async () => {
  const readCandidate = jest.fn(async (path) => {
    if (path === "incomplete.json") {
      throw new Error("Detailed coverage omits in-scope source file(s): src/example.mjs.");
    }
    return { totals: { lines: 100 }, gaps: [] };
  });
  await expect(selectCoverageEvidence(["incomplete.json", "valid.json"], readCandidate))
    .resolves.toMatchObject({ source: "valid.json" });
  expect(readCandidate).toHaveBeenCalledTimes(2);

  await expect(
    selectCoverageEvidence(["incomplete.json"], async () => {
      throw new Error("Detailed coverage omits in-scope source file(s): src/example.mjs.");
    }),
  ).rejects.toThrow("Detailed coverage omits in-scope source file(s)");
});

test("falls back when detailed evidence has no source-derived shape", async () => {
  const readCandidate = jest.fn(async (path) => {
    if (path === "unshaped.json") {
      throw new Error("Detailed coverage has no source-derived shape for src/example.mjs.");
    }
    return { totals: { lines: 100 }, gaps: [] };
  });
  await expect(selectCoverageEvidence(["unshaped.json", "valid.json"], readCandidate))
    .resolves.toMatchObject({ source: "valid.json" });
  expect(readCandidate).toHaveBeenCalledTimes(2);
});

test("falls through after malformed map/counter evidence and fails when no candidate is usable", async () => {
  const malformed = new Error("Coverage evidence is incomplete for src/example.mjs.");
  await expect(
    selectCoverageEvidence(["malformed.json", "valid.json"], async (path) => {
      if (path === "malformed.json") throw malformed;
      return { totals: { lines: 100 }, gaps: [] };
    }),
  ).resolves.toMatchObject({ source: "valid.json" });
  await expect(
    selectCoverageEvidence(["malformed.json"], async () => {
      throw malformed;
    }),
  ).rejects.toBe(malformed);
});

test("classifies missing and summary-only candidates as unusable", async () => {
  await expect(selectCoverageEvidence(["empty.json"], async () => null)).rejects.toThrow(
    "Coverage report is invalid: empty.json",
  );
  await expect(
    selectCoverageEvidence(["summary.json"], async () => {
      throw new Error("Summary-only coverage cannot prove file-level coverage");
    }),
  ).rejects.toThrow("Summary-only coverage");
  await expect(
    selectCoverageEvidence(["missing.json"], async () => {
      throw { code: "ENOENT" };
    }),
  ).rejects.toThrow("Coverage evidence is missing");
});

test("uses text evidence only when it is parseable and fresh evidence is not required", async () => {
  await expect(selectCoverageEvidence([], jest.fn(), text, false, ["src/example.mjs"])).resolves.toMatchObject({
    source: "Jest text output",
    totals: { lines: 100 },
    gaps: [],
  });
  await expect(selectCoverageEvidence([], jest.fn(), text, true, ["src/example.mjs"])).rejects.toThrow(
    "cannot prove freshness",
  );
  await expect(selectCoverageEvidence([], jest.fn(), "not a report")).rejects.toThrow(
    "Coverage evidence is missing",
  );
});

test("does not trust text coverage when discovered source files are unavailable", async () => {
  await expect(selectCoverageEvidence([], jest.fn(), text)).rejects.toThrow(
    "Coverage evidence is missing",
  );
});

test("immediately propagates errors outside the unusable-report categories", async () => {
  await expect(
    selectCoverageEvidence(["coverage.json"], async () => {
      throw new Error("permission denied");
    }),
  ).rejects.toThrow("permission denied");
});
