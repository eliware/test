import { expect, test } from "@jest/globals";
import {
  compareReleaseVersions,
  isValidReleaseDate,
} from "../../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/notes/version-order.mjs";

test("validates calendar dates", () => {
  expect(isValidReleaseDate("2024-02-29")).toBe(true);
  expect(isValidReleaseDate("2026-02-30")).toBe(false);
  expect(isValidReleaseDate("not-a-date")).toBe(false);
});

test("compares numeric version parts", () => {
  expect(compareReleaseVersions("15.0.0", "9.99.99")).toBe(1);
  expect(compareReleaseVersions("15.8.0", "15.9.0")).toBe(-1);
  expect(compareReleaseVersions("1.2.3", "1.2.3")).toBe(0);
});
