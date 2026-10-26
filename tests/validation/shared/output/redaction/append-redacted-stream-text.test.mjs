import { expect, jest, test } from "@jest/globals";
import { createPendingTextChunks } from "../../../../../src/validation/shared/output/redaction/create/pending-text-chunks.mjs";
import { appendRedactedStreamText } from "../../../../../src/validation/shared/output/redaction/append-redacted-stream-text.mjs";

function options(overrides = {}) {
  return {
    text: "plain",
    pending: "",
    pendingLimit: 10,
    bufferLimit: 20,
    findSafeBoundary: (text) => ({ boundary: text.length, matchEnds: [], suppressed: false }),
    append: (text) => text,
    canContinue: () => true,
    suppress: jest.fn(),
    ...overrides,
  };
}

test("appends plain text through the string-backed boundary path", () => {
  expect(appendRedactedStreamText(options())).toEqual({ output: "plain", pending: "" });
});

test("joins output from many safe boundaries in order", () => {
  const result = appendRedactedStreamText(
    options({ text: "x".repeat(1_000), pendingLimit: 1, bufferLimit: 1 }),
  );
  expect(result).toEqual({ output: "x".repeat(1_000), pending: "" });
});

test("retains text while its safety boundary cannot advance", () => {
  const result = appendRedactedStreamText(
    options({ findSafeBoundary: () => ({ boundary: 0, matchEnds: [], suppressed: false }) }),
  );
  expect(result).toEqual({ output: "", pending: "plain" });
});

test("retains a secret that crosses the emitted safety boundary", () => {
  const result = appendRedactedStreamText(
    options({
      text: "abcXYZtail",
      pendingLimit: 20,
      findSafeBoundary: () => ({ boundary: 3, matchEnds: [6], suppressed: false }),
    }),
  );
  expect(result.output).toBe("");
  expect(result.pending).toBe("abcXYZtail");
});

test("checks only populated match offsets in a sparse result", () => {
  const matchEnds = [];
  matchEnds.length = 1_000_000;
  Object.defineProperty(matchEnds, "999999", { value: 1_000_001, enumerable: true });
  let reads = 0;
  const sparseMatches = new Proxy(matchEnds, {
    get(target, property, receiver) {
      if (property === "999999") reads += 1;
      return Reflect.get(target, property, receiver);
    },
  });
  const result = appendRedactedStreamText(
    options({
      text: "a".repeat(1_000_000),
      pendingLimit: 1_000_000,
      bufferLimit: 1_000_000,
      findSafeBoundary: () => ({ boundary: 1_000_000, matchEnds: sparseMatches }),
    }),
  );

  expect(reads).toBe(1);
  expect(result.output).toBe("a".repeat(999_999));
});

test("suppresses output when the safety search fails or the bounded buffer fills", () => {
  const suppress = jest.fn();
  expect(
    appendRedactedStreamText(
      options({
        findSafeBoundary: () => ({ boundary: 0, matchEnds: [], suppressed: true }),
        suppress,
      }),
    ),
  ).toEqual({ output: "", pending: "" });
  expect(
    appendRedactedStreamText(options({ text: "x", pending: "held", bufferLimit: 4, suppress })),
  ).toEqual({ output: "", pending: "" });
  expect(suppress).toHaveBeenCalledTimes(2);
});

test("keeps surrogate pairs intact while splitting input and emitted boundaries", () => {
  const text = "A😀B";
  const append = jest.fn((value) => value);
  const result = appendRedactedStreamText(
    options({
      text,
      pendingLimit: 2,
      bufferLimit: 4,
      findSafeBoundary: (pending) => ({
        boundary: pending.length === 3 ? 2 : pending.length,
        matchEnds: [],
        suppressed: false,
      }),
      append,
    }),
  );
  expect(result.output).toBe("A😀");
  expect(result.pending).toBe("B");
  expect(append.mock.calls.map(([value]) => value)).toEqual(["A", "😀"]);
});

test("holds a high surrogate until the next input chunk can complete its pair", () => {
  const first = appendRedactedStreamText(options({ text: "\uD83D" }));
  expect(first).toEqual({ output: "", pending: "\uD83D" });
  expect(appendRedactedStreamText(options({ text: "\uDE00", pending: first.pending }))).toEqual({
    output: "😀",
    pending: "",
  });
});

test("streams through the incremental chunk queue and handles empty or stopped input", () => {
  const pendingChunks = createPendingTextChunks();
  const streamed = appendRedactedStreamText(
    options({
      text: "chunk",
      pendingChunks,
      findSafeBoundary: { appendText: (_text, length) => ({ boundary: length, matchEnds: [] }) },
    }),
  );
  expect(streamed.output).toBe("chunk");
  expect(pendingChunks.length).toBe(0);
  expect(appendRedactedStreamText(options({ text: "", canContinue: () => false }))).toEqual({
    output: "",
    pending: "",
  });
  expect(appendRedactedStreamText(options({ text: "held", canContinue: () => false }))).toEqual({
    output: "",
    pending: "",
  });
});

test("suppresses a surrogate pair that cannot fit the remaining capacity", () => {
  const suppress = jest.fn();
  expect(
    appendRedactedStreamText(options({ text: "😀", pendingLimit: 1, bufferLimit: 1, suppress })),
  ).toEqual({ output: "", pending: "" });
  expect(suppress).toHaveBeenCalledTimes(1);
});

test("accepts an unpaired high surrogate without treating the next character as its pair", () => {
  const result = appendRedactedStreamText(options({ text: "\uD800x", pendingLimit: 1 }));
  expect(result.output).toBe("\uD800x");
  expect(result.pending).toBe("");
});
