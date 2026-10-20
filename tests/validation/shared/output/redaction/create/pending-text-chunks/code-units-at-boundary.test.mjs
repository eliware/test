import { expect, test } from "@jest/globals";
import { readPendingCodeUnitsAtBoundary } from "../../../../../../../src/validation/shared/output/redaction/create/pending-text-chunks/code-units-at-boundary.mjs";

test("returns no code units for empty queues and invalid indexes", () => {
  const chunks = [{ text: "a", start: 0 }];
  expect(readPendingCodeUnitsAtBoundary(chunks, 0, 0, 0, 0)).toEqual({
    previous: NaN,
    next: NaN,
  });
  for (const index of [-1, 2, 0.5, Number.NaN])
    expect(readPendingCodeUnitsAtBoundary(chunks, 0, 0, 1, index)).toEqual({
      previous: NaN,
      next: NaN,
    });
});

test("reads code units within chunks and across a chunk boundary", () => {
  const chunks = [
    { text: "ab", start: 0 },
    { text: "😀tail", start: 2 },
  ];
  expect(readPendingCodeUnitsAtBoundary(chunks, 0, 0, 8, 2)).toEqual({
    previous: "b".charCodeAt(0),
    next: 0xd83d,
  });
  expect(readPendingCodeUnitsAtBoundary(chunks, 0, 0, 8, 3)).toEqual({
    previous: 0xd83d,
    next: 0xde00,
  });
  expect(readPendingCodeUnitsAtBoundary(chunks, 0, 0, 8, 8)).toEqual({
    previous: "l".charCodeAt(0),
    next: NaN,
  });
});

test("uses the active chunk after a consumed prefix", () => {
  const chunks = [
    { text: "old", start: 0 },
    { text: "tail", start: 3 },
  ];
  expect(readPendingCodeUnitsAtBoundary(chunks, 1, 3, 7, 0)).toEqual({
    previous: NaN,
    next: "t".charCodeAt(0),
  });
});
