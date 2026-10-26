import { expect, test } from "@jest/globals";
import { validateReleaseDateHistory } from "../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/date-history.mjs";

test("accepts valid dates in descending history order", () => {
  expect(validateReleaseDateHistory(["2026-10-15", "2026-10-14"])).toEqual([]);
});

test("reports invalid dates and dates that increase", () => {
  expect(validateReleaseDateHistory(["2026-02-30", "2026-03-01"])).toEqual([
    "Release date is invalid: 2026-02-30.",
    "Release dates must not increase.",
  ]);
});
