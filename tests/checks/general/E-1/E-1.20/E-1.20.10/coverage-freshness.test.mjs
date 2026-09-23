import { expect, test } from "@jest/globals";
import { assertFreshCoverage } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/coverage-freshness.mjs";

test("accepts fresh coverage evidence", () => {
  expect(() => assertFreshCoverage({ mtimeMs: 2 }, { mtimeMs: 3 }, "coverage.json", 1)).not.toThrow();
});

test("rejects stale or changed coverage evidence", () => {
  expect(() => assertFreshCoverage({ mtimeMs: 2 }, { mtimeMs: 2 }, "coverage.json", 3)).toThrow("stale");
  expect(() => assertFreshCoverage(null, null, "coverage.json", 1)).toThrow("stale");
  expect(() => assertFreshCoverage({ mtimeMs: 1 }, { mtimeMs: 3 }, "coverage.json", 2)).toThrow("stale");
});

test("rejects a report timestamp equal to the Jest start time", () => {
  expect(() => assertFreshCoverage({ mtimeMs: 10 }, { mtimeMs: 10 }, "coverage.json", 10)).toThrow("stale");
});
