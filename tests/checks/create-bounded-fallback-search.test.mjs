import { expect, test } from "@jest/globals";
import { createBoundedFallbackSearch } from "../../src/checks/create-bounded-fallback-search.mjs";

test("retains secret prefixes and suppresses work after the cumulative limit", () => {
  const search = createBoundedFallbackSearch(["secret"], 20, (text) => {
    const ends = Array.from({ length: text.length + 1 }, () => 0);
    const start = text.indexOf("secret");
    if (start >= 0) ends[start] = start + 6;
    return ends;
  });
  expect(search("safe secret")).toMatchObject({ boundary: 5, suppressed: false });
  expect(search("secretX")).toMatchObject({ boundary: 0, suppressed: false });
  expect(search("12345678901234567890")).toMatchObject({
    boundary: 0,
    suppressed: true,
  });
  expect(createBoundedFallbackSearch(["a"], 100, () => null)("a")).toMatchObject({
    suppressed: true,
  });
});

test("suppresses malformed matcher output before calculating a boundary", () => {
  for (const matcher of [
    () => [0],
    () => [0, undefined, 0],
    () => Object.assign([], { length: 6 }),
    () => Object.assign(Array(6).fill(0), { work: Number.NaN }),
    () => Object.assign(Array(6).fill(0), { work: -1 }),
  ]) {
    expect(createBoundedFallbackSearch(["secret"], 100, matcher)("secret")).toMatchObject({
      boundary: 0,
      suppressed: true,
    });
  }
});

test("checks for a secret match beginning exactly at the candidate boundary", () => {
  const search = createBoundedFallbackSearch(["secret"], 100, (text) => {
    const ends = Array.from({ length: text.length + 1 }, () => 0);
    const start = text.indexOf("secret");
    if (start >= 0) ends[start] = start + "secret".length;
    return ends;
  });

  expect(search("1234secret")).toMatchObject({ boundary: 4, suppressed: false });
});
