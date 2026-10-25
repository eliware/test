import { expect, test } from "@jest/globals";
import { createIncrementalSearch } from "../../../../../../../src/validation/shared/output/redaction/create/incremental/secret-search.mjs";
import { createSecretTextMatcher } from "../../../../../../../src/validation/shared/output/redaction/create/secret-text-matcher.mjs";

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
  expect(result.matchEnds.get(6)).toBe(12);
});

test("accepts incremental text directly and rejects invalid incremental arguments", () => {
  const search = createIncrementalSearch(
    ["secret"],
    100,
    createSecretTextMatcher(["secret"]).createStream,
  );
  expect(search.appendText("safe ", 5).boundary).toBe(0);
  const result = search.appendText("secret", 11);
  expect(result).toMatchObject({
    boundary: 5,
    matchEnds: expect.any(Array),
    suppressed: false,
  });
  expect(Array.from(result.matchEnds, (value) => value ?? 0)).toEqual([0, 0, 0, 0, 0, 11]);
  expect(search.appendText(null, 11).suppressed).toBe(true);
  expect(search.appendText("x", Number.NaN).suppressed).toBe(true);
  expect(search.appendText("xx", 1).suppressed).toBe(true);
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
  const search = createIncrementalSearch(["abc"], 100, () => () => ({
    matches: [
      { start: 1, end: 5 },
      { start: 3, end: 6 },
    ],
    work: 1,
  }));
  const safePrefix = search("abcdef");
  expect(safePrefix.boundary).toBe(1);
  expect(Array.from(safePrefix.matchEnds, (value) => value ?? 0)).toEqual([0, 5]);
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
  const finished = finishSearch("secret", true);
  expect(finished.matchEnds).toBeInstanceOf(Map);
  expect([...finished.matchEnds]).toEqual([[0, 6]]);
});

test("merges newly discovered intervals into retained order", () => {
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
