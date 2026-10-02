import { expect, test } from "@jest/globals";
import { createPendingTextChunks } from "../../src/checks/create-pending-text-chunks.mjs";

test("joins appended chunks and consumes prefixes across chunk boundaries", () => {
  const pending = createPendingTextChunks();
  pending.append("abc");
  pending.append("defg");
  expect(pending.length).toBe(7);
  expect(pending.takePrefix(5)).toBe("abcde");
  expect(pending.length).toBe(2);
  expect(pending.toString()).toBe("fg");
});

test("clears chunks and safely handles empty prefix operations", () => {
  const pending = createPendingTextChunks();
  pending.append("");
  expect(pending.takePrefix(0)).toBe("");
  pending.append("safe");
  pending.clear();
  expect(pending.length).toBe(0);
  expect(pending.toString()).toBe("");
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
