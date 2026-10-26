import { expect, test } from "@jest/globals";
import {
  adjustRedactedStreamBoundary,
  splitsSurrogatePair,
} from "../../../../../../src/validation/shared/output/redaction/stream/boundary.mjs";

test("moves a safe boundary before an overlapping match", () => {
  const matchEnds = [undefined, 7, undefined, 5];
  expect(adjustRedactedStreamBoundary(matchEnds, 4, undefined, "abcdefg")).toBe(1);
  expect(matchEnds).toHaveLength(2);
});

test("keeps the boundary when no match crosses it", () => {
  expect(adjustRedactedStreamBoundary([undefined, 2], 3, undefined, "abcd")).toBe(3);
});

test("moves boundaries away from surrogate pairs in strings and chunk buffers", () => {
  expect(adjustRedactedStreamBoundary([], 2, undefined, "a😀b")).toBe(1);
  expect(adjustRedactedStreamBoundary([], 4, undefined, "abc\ud83d")).toBe(3);
  const pendingChunks = {
    length: 4,
    codeUnitsAtBoundary: () => ({ previous: 0xd83d, next: 0xde00 }),
  };
  expect(adjustRedactedStreamBoundary([], 2, pendingChunks, "")).toBe(1);
});

test("detects a chunk boundary inside a surrogate pair", () => {
  expect(splitsSurrogatePair("text\ud83d", 0xde00)).toBe(true);
  expect(splitsSurrogatePair("text", 0xde00)).toBe(false);
});
