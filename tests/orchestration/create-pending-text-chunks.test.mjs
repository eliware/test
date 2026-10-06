import { expect, test } from "@jest/globals";
import { createPendingTextChunks } from "../../src/orchestration/create-pending-text-chunks.mjs";

test("joins appended chunks and consumes prefixes across chunk boundaries", () => {
  const pending = createPendingTextChunks();
  pending.append("abc");
  pending.append("defg");
  pending.append("hi");
  expect(pending.length).toBe(9);
  expect(pending.takePrefix(5)).toBe("abcde");
  expect(pending.length).toBe(4);
  expect(pending.toString()).toBe("fghi");
});

test("reads boundary code units without joining the queue", () => {
  const pending = createPendingTextChunks();
  pending.append("left");
  pending.append("😀tail");
  expect(pending.codeUnitsAtBoundary(5)).toEqual({ previous: 0xd83d, next: 0xde00 });
  expect(pending.codeUnitsAtBoundary(-1)).toEqual({ previous: NaN, next: NaN });
  expect(pending.codeUnitsAtBoundary(pending.length + 1)).toEqual({
    previous: NaN,
    next: NaN,
  });
  expect(pending.codeUnitsAtBoundary(pending.length)).toEqual({
    previous: "l".charCodeAt(0),
    next: NaN,
  });
  expect(pending.takePrefix(6)).toBe("left😀");
  expect(pending.codeUnitsAtBoundary(0)).toEqual({
    previous: NaN,
    next: "t".charCodeAt(0),
  });
  expect(pending.toString()).toBe("tail");
});

test("reads code units correctly after repeatedly consuming part of the head chunk", () => {
  const pending = createPendingTextChunks();
  pending.append("prefix");
  pending.append("\ud83d\ude00tail");

  expect(pending.takePrefix(3)).toBe("pre");
  expect(pending.takePrefix(3)).toBe("fix");
  expect(pending.codeUnitsAtBoundary(1)).toEqual({ previous: 0xd83d, next: 0xde00 });
  expect(pending.takePrefix(2)).toBe("😀");
  expect(pending.codeUnitsAtBoundary(0)).toEqual({
    previous: NaN,
    next: "t".charCodeAt(0),
  });
});

test("clears chunks and safely handles empty prefix operations", () => {
  const pending = createPendingTextChunks();
  pending.append("");
  expect(pending.takePrefix(0)).toBe("");
  pending.append("safe");
  pending.clear();
  expect(pending.length).toBe(0);
  expect(pending.toString()).toBe("");
  expect(pending.codeUnitsAtBoundary(0)).toEqual({ previous: NaN, next: NaN });
});

test("reads adjacent code units across a chunk boundary", () => {
  const pending = createPendingTextChunks();
  pending.append("a");
  pending.append("b");
  expect(pending.codeUnitsAtBoundary(1)).toEqual({
    previous: "a".charCodeAt(0),
    next: "b".charCodeAt(0),
  });
});

test("compacts consumed chunk prefixes after many small writes", () => {
  const pending = createPendingTextChunks();
  for (let index = 0; index < 1100; index += 1) {
    pending.append("x");
    expect(pending.takePrefix(1)).toBe("x");
  }
  expect(pending.length).toBe(0);
  expect(pending.toString()).toBe("");
});

test("joins a large number of retained tiny chunks without argument spreading", () => {
  const pending = createPendingTextChunks();
  for (let index = 0; index < 50_000; index += 1) pending.append("x");
  expect(pending.length).toBe(50_000);
  expect(pending.toString()).toBe("x".repeat(50_000));
});
