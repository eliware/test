import { expect, test } from "@jest/globals";
import {
  compareReleaseVersions,
  isValidReleaseDate,
} from "../../../../../../../src/checks/application/E-0.1.4.1.4/validate/release/notes/version-order.mjs";

test("validates calendar dates", () => {
  expect(isValidReleaseDate("2024-02-29")).toBe(true);
  expect(isValidReleaseDate("2026-02-30")).toBe(false);
  expect(isValidReleaseDate("not-a-date")).toBe(false);
});

test("compares numeric version parts", () => {
  expect(compareReleaseVersions("13.0.0", "12.99.99")).toBe(1);
  expect(compareReleaseVersions("12.8.0", "12.9.0")).toBe(-1);
  expect(compareReleaseVersions("1.2.3", "1.2.3")).toBe(0);
});
