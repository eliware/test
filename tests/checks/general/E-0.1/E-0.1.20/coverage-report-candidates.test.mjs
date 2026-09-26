import { expect, test } from "@jest/globals";
import { coverageCandidates } from "../../../../../src/checks/general/E-0.1/E-0.1.20/coverage-report-candidates.mjs";

test("defines detailed coverage reports before summary-only fallbacks", () => {
  expect(coverageCandidates).toEqual([
    "coverage/coverage-final.json",
    "coverage/coverage-summary.json",
    "coverage/coverage.json",
    "coverage.json",
  ]);
});
