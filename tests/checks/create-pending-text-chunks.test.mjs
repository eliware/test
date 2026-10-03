import { expect, test } from "@jest/globals";
import { createPendingTextChunks } from "../../src/checks/create-pending-text-chunks.mjs";

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

test("reads code units from bounded positions without joining the queue", () => {
  const pending = createPendingTextChunks();
  pending.append("left");
  pending.append("😀tail");
  expect(pending.codeUnitAt(4)).toBe(0xd83d);
  expect(pending.codeUnitAt(5)).toBe(0xde00);
  expect(pending.codeUnitAt(-1)).toBeNaN();
  expect(pending.codeUnitAt(pending.length)).toBeNaN();
  expect(pending.takePrefix(6)).toBe("left😀");
  expect(pending.codeUnitAt(0)).toBe("t".charCodeAt(0));
  expect(pending.toString()).toBe("tail");
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
