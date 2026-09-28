import { expect, test } from "@jest/globals";
import { createBoundedSecretSearch } from "../../src/checks/create-bounded-secret-search.mjs";
import { createSecretTextMatcher } from "../../src/checks/create-secret-text-matcher.mjs";

test("retains secret prefixes and suppresses work after the cumulative limit", () => {
  const search = createBoundedSecretSearch(["secret"], 20, (text) => {
    const ends = Array.from({ length: text.length + 1 }, () => 0);
    const start = text.indexOf("secret");
    if (start >= 0) ends[start] = start + 6;
    return ends;
  });
  expect(search("safe secret")).toMatchObject({ boundary: 5, suppressed: false });
  expect(search("secretX")).toMatchObject({ boundary: 0, suppressed: false });
  expect(search("12345678901234567890")).toMatchObject({ boundary: 0, suppressed: true });
  const failedSearch = createBoundedSecretSearch(["a"], 100, () => null);
  expect(failedSearch("a")).toMatchObject({ suppressed: true });
});

test("suppresses malformed fallback matcher output before calculating a boundary", () => {
  for (const matcher of [
    () => [0],
    () => [0, undefined, 0],
    () => Object.assign([], { length: 6 }),
    () => Object.assign(Array(6).fill(0), { work: Number.NaN }),
    () => Object.assign(Array(6).fill(0), { work: -1 }),
  ]) {
    expect(createBoundedSecretSearch(["secret"], 100, matcher)("secret")).toMatchObject({
      boundary: 0,
      suppressed: true,
    });
  }
});

test("reuses automaton state instead of rescanning the retained suffix", () => {
  const matcher = createSecretTextMatcher(["secret"]);
  const search = createBoundedSecretSearch(["secret"], 20, matcher);
  expect(search("safe ")).toMatchObject({ boundary: 0, suppressed: false });
  expect(search("safe secret")).toMatchObject({ boundary: 5, suppressed: false });
  expect(search("secretX")).toMatchObject({ boundary: 0, suppressed: false });
});

test("tracks the absolute start after emitting more than one pending prefix", () => {
  const matcher = createSecretTextMatcher(["secret"]);
  const search = createBoundedSecretSearch(["secret"], 100, matcher);

  expect(search("safe ").boundary).toBe(0);
  expect(search("safe safe ").boundary).toBe(4);
  const result = search(" safe secret", true);

  expect(result.suppressed).toBe(false);
  expect(result.matchEnds[6]).toBe(12);
});

test("suppresses malformed incremental state and work-budget overflow", () => {
  const nullMatcher = () => [];
  nullMatcher.createStream = () => () => null;
  expect(createBoundedSecretSearch(["x"], 10, nullMatcher)("x")).toMatchObject({
    suppressed: true,
  });

  const expensiveMatcher = () => [];
  expensiveMatcher.createStream = () => () => ({ matches: [], work: 11 });
  expect(createBoundedSecretSearch(["x"], 10, expensiveMatcher)("x")).toMatchObject({
    suppressed: true,
  });

  const emptyMatcher = () => [];
  emptyMatcher.createStream = () => () => ({ matches: [], work: 1 });
  const search = createBoundedSecretSearch(["abc"], 100, emptyMatcher);
  expect(search("abc")).toMatchObject({ suppressed: false });
  expect(search("different")).toMatchObject({ suppressed: true });
});

test("keeps only overlapping matches inside the pending window", () => {
  let call = 0;
  const matcher = () => [];
  matcher.createStream = () => () => ({
    matches:
      call++ === 0
        ? [
            { start: -1, end: 2 },
            { start: 1, end: 5 },
            { start: 3, end: 9 },
          ]
        : [],
    work: 1,
  });
  const search = createBoundedSecretSearch(["abc"], 100, matcher);
  const safePrefix = search("abcdef");
  expect(safePrefix.boundary).toBe(1);
  expect(safePrefix.matchEnds).toEqual([0, 5]);

  let filteredCall = 0;
  const filteredMatcher = () => [];
  filteredMatcher.createStream = () => () => ({
    matches: filteredCall++ === 0 ? [{ start: 0, end: 2 }] : [],
    work: 1,
  });
  const filtered = createBoundedSecretSearch(["abc"], 100, filteredMatcher);
  expect(filtered("abcdef").boundary).toBe(3);
  expect(filtered("defg").boundary).toBe(1);
});

test("materializes match indexes only for each newly emitted range", () => {
  const matcher = () => [];
  matcher.createStream = () => () => ({ matches: [], work: 1 });
  const search = createBoundedSecretSearch(["x".repeat(50_000)], 100, matcher);

  expect(search("a".repeat(30_000)).matchEnds).toHaveLength(1);
  expect(search("a".repeat(50_000)).matchEnds).toHaveLength(1);
});

test("materializes pending matches when finishing the stream", () => {
  const matcher = () => [];
  matcher.createStream = () => () => ({ matches: [{ start: 0, end: 6 }], work: 1 });
  const search = createBoundedSecretSearch(["secret"], 100, matcher);

  expect(search("secret", true).matchEnds).toEqual([6, 0, 0, 0, 0, 0, 0]);
});

test("keeps the boundary before a matched interval extending beyond the pending window", () => {
  const matcher = () => [];
  matcher.createStream = () => () => ({ matches: [{ start: 2, end: 9 }], work: 1 });
  const search = createBoundedSecretSearch(["abc"], 100, matcher);
  const pending = "abcdef";
  const matchStart = 2;
  const { boundary } = search(pending);

  expect(boundary).toBeLessThanOrEqual(matchStart);
  expect(pending.slice(0, boundary)).not.toContain(pending.slice(matchStart));
});

test("merges newly discovered intervals into the retained interval order", () => {
  let call = 0;
  const matcher = () => [];
  matcher.createStream = () => () => ({
    matches: call++ === 0 ? [{ start: 10, end: 12 }] : [{ start: 0, end: 1 }],
    work: 1,
  });
  const search = createBoundedSecretSearch(["abcd"], 100, matcher);
  search("abcdef");
  expect(search("cdefg").suppressed).toBe(false);

  let orderedCall = 0;
  const orderedMatcher = () => [];
  orderedMatcher.createStream = () => () => ({
    matches:
      orderedCall++ === 0
        ? [
            { start: 0, end: 4 },
            { start: 0, end: 5 },
          ]
        : [{ start: 6, end: 7 }],
    work: 1,
  });
  const orderedSearch = createBoundedSecretSearch(["abcd"], 100, orderedMatcher);
  orderedSearch("abcdef");
  expect(orderedSearch("abcdefg").suppressed).toBe(false);
});
