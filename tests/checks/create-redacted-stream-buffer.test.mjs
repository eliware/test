import { expect, jest, test } from "@jest/globals";
import { StringDecoder } from "node:string_decoder";
import { createRedactedStreamBuffer } from "../../src/checks/create-redacted-stream-buffer.mjs";

function createBuffer(overrides = {}) {
  let suppressed = false;
  const append = jest.fn((text) => text);
  const buffer = createRedactedStreamBuffer({
    pendingLimit: 8,
    decoder: new StringDecoder("utf8"),
    findSafeBoundary: jest.fn((text, final = false) => ({
      boundary: final ? text.length : text.length - 3,
      matchEnds: [],
      suppressed: false,
    })),
    trimSuffix: (text) => text,
    append,
    canContinue: () => !suppressed,
    suppress: () => {
      suppressed = true;
    },
    ...overrides,
  });
  return { buffer, append };
}

test("buffers text to a safe boundary and flushes the retained suffix once", () => {
  const { buffer } = createBuffer();
  expect(buffer.addText("abcdefgh")).toBe("abcde");
  expect(buffer.finish()).toBe("fgh");
  expect(buffer.finish()).toBe("");
  expect(buffer.addText("later")).toBe("");
});

test("suppresses pending output when boundary search exceeds its budget", () => {
  let suppressed = false;
  const { buffer, append } = createBuffer({
    canContinue: () => !suppressed,
    suppress: () => {
      suppressed = true;
    },
    findSafeBoundary: () => ({ boundary: 0, matchEnds: null, suppressed: true }),
  });
  expect(buffer.addText("unsafe")).toBe("");
  expect(buffer.finish()).toBe("");
  expect(append).not.toHaveBeenCalled();
});

test("retains an unsafe prefix until finishing supplies a complete boundary", () => {
  const findSafeBoundary = jest
    .fn()
    .mockReturnValueOnce({ boundary: 0, matchEnds: [], suppressed: false })
    .mockImplementation((_text, final = false) => ({
      boundary: final ? 8 : 0,
      matchEnds: [],
      suppressed: false,
    }));
  const { buffer } = createBuffer({ findSafeBoundary });
  expect(buffer.addText("abcdefgh")).toBe("");
  expect(buffer.finish()).toBe("abcdefgh");
});

test("suppresses buffered text when the final boundary scan exceeds its budget", () => {
  let suppressed = false;
  const { buffer, append } = createBuffer({
    canContinue: () => !suppressed,
    suppress: () => {
      suppressed = true;
    },
    findSafeBoundary: (_text, final = false) => ({
      boundary: final ? 0 : 0,
      matchEnds: null,
      suppressed: final,
    }),
  });
  expect(buffer.addText("pending")).toBe("");
  expect(buffer.finish()).toBe("");
  expect(append).not.toHaveBeenCalled();
});
