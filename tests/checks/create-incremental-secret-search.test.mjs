import { expect, test } from "@jest/globals";
import { createIncrementalSearch } from "../../src/checks/create-incremental-secret-search.mjs";
import { createSecretTextMatcher } from "../../src/checks/create-secret-text-matcher.mjs";

test("reuses automaton state instead of rescanning the retained suffix", () => {
  const search = createIncrementalSearch(
    ["secret"],
    20,
    createSecretTextMatcher(["secret"]).createStream,
  );
  expect(search("safe ")).toMatchObject({ boundary: 0, suppressed: false });
  expect(search("safe secret")).toMatchObject({ boundary: 5, suppressed: false });
  expect(search("secretX")).toMatchObject({ boundary: 0, suppressed: false });
});

test("tracks absolute positions after emitting more than one pending prefix", () => {
  const search = createIncrementalSearch(
    ["secret"],
    100,
    createSecretTextMatcher(["secret"]).createStream,
  );
  expect(search("safe ").boundary).toBe(0);
  expect(search("safe safe ").boundary).toBe(4);
  const result = search(" safe secret", true);
  expect(result.suppressed).toBe(false);
  expect(result.matchEnds[6]).toBe(12);
});

test("suppresses malformed stream state and cumulative work overflow", () => {
  const nullStream = () => () => null;
  expect(createIncrementalSearch(["x"], 10, nullStream)("x")).toMatchObject({
    suppressed: true,
  });

  const expensiveStream = () => () => ({ matches: [], work: 11 });
  expect(createIncrementalSearch(["x"], 10, expensiveStream)("x")).toMatchObject({
    suppressed: true,
  });

  const emptyStream = () => () => ({ matches: [], work: 1 });
  const search = createIncrementalSearch(["abc"], 100, emptyStream);
  expect(search("abc")).toMatchObject({ suppressed: false });
  expect(search("different")).toMatchObject({ suppressed: true });
});

test("keeps overlapping matches in the pending window", () => {
  let call = 0;
  const search = createIncrementalSearch(["abc"], 100, () => () => ({
    matches:
      call++ === 0
        ? [
            { start: -1, end: 2 },
            { start: 1, end: 5 },
            { start: 3, end: 9 },
          ]
        : [],
    work: 1,
  }));
  const safePrefix = search("abcdef");
  expect(safePrefix.boundary).toBe(1);
  expect(safePrefix.matchEnds).toEqual([0, 5]);
});

test("materializes only newly emitted ranges and pending matches on finish", () => {
  const longSecretSearch = createIncrementalSearch(["x".repeat(50_000)], 100, () => () => ({
    matches: [],
    work: 1,
  }));
  expect(longSecretSearch("a".repeat(30_000)).matchEnds).toHaveLength(1);
  expect(longSecretSearch("a".repeat(50_000)).matchEnds).toHaveLength(1);

  const finishSearch = createIncrementalSearch(["secret"], 100, () => () => ({
    matches: [{ start: 0, end: 6 }],
    work: 1,
  }));
  expect(finishSearch("secret", true).matchEnds).toEqual([6, 0, 0, 0, 0, 0, 0]);
});

test("keeps the boundary before a matched interval extending beyond the window", () => {
  const search = createIncrementalSearch(["abc"], 100, () => () => ({
    matches: [{ start: 2, end: 9 }],
    work: 1,
  }));
  const pending = "abcdef";
  const matchStart = 2;
  const { boundary } = search(pending);
  expect(boundary).toBeLessThanOrEqual(matchStart);
  expect(pending.slice(0, boundary)).not.toContain(pending.slice(matchStart));
});

test("merges newly discovered intervals into retained order", () => {
  let call = 0;
  const search = createIncrementalSearch(["abcd"], 100, () => () => ({
    matches: call++ === 0 ? [{ start: 10, end: 12 }] : [{ start: 0, end: 1 }],
    work: 1,
  }));
  search("abcdef");
  expect(search("cdefg").suppressed).toBe(false);

  let orderedCall = 0;
  const orderedSearch = createIncrementalSearch(["abcd"], 100, () => () => ({
    matches:
      orderedCall++ === 0
        ? [
            { start: 0, end: 4 },
            { start: 0, end: 5 },
          ]
        : [{ start: 6, end: 7 }],
    work: 1,
  }));
  orderedSearch("abcdef");
  expect(orderedSearch("abcdefg").suppressed).toBe(false);
});
