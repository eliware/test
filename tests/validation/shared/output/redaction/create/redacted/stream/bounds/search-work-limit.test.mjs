import { expect, test } from "@jest/globals";
import {
  MAX_SECRET_SEARCH_WORK_PER_CHUNK,
  resolveSearchWorkLimit,
} from "../../../../../../../../../src/validation/shared/output/redaction/create/redacted/stream/bounds/search-work-limit.mjs";

test("uses the default for non-finite search work limits", () => {
  expect(resolveSearchWorkLimit(Number.NaN)).toBe(MAX_SECRET_SEARCH_WORK_PER_CHUNK);
});

test("floors the minimum and caps the maximum search work limits", () => {
  expect(resolveSearchWorkLimit(0)).toBe(1);
  expect(resolveSearchWorkLimit(5)).toBe(5);
  expect(resolveSearchWorkLimit(2_000_000)).toBe(MAX_SECRET_SEARCH_WORK_PER_CHUNK);
});
