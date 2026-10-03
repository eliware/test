import { expect, jest, test } from "@jest/globals";
import { StringDecoder } from "node:string_decoder";
import { createRedactedStreamBuffer } from "../../src/checks/create-redacted-stream-buffer.mjs";
import { createPendingTextChunks } from "../../src/checks/create-pending-text-chunks.mjs";

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

test("passes incremental text without joining retained chunks on each append", () => {
  const findSafeBoundary = jest.fn((_text, length, final = false) => ({
    boundary: final ? length : 0,
    matchEnds: [],
    suppressed: false,
  }));
  findSafeBoundary.appendText = jest.fn((_text, length, final = false) => ({
    boundary: final ? length : 0,
    matchEnds: [],
    suppressed: false,
  }));
  const { buffer } = createBuffer({ findSafeBoundary });
  for (const character of "abcdefgh") expect(buffer.addText(character)).toBe("");
  expect(findSafeBoundary).not.toHaveBeenCalled();
  expect(findSafeBoundary.appendText.mock.calls.map(([text]) => text)).toEqual([..."abcdefgh"]);
  expect(buffer.finish()).toBe("abcdefgh");
});

test("consumes a safe prefix from the incremental chunk queue", () => {
  const findSafeBoundary = () => ({ boundary: 0, matchEnds: [], suppressed: false });
  findSafeBoundary.appendText = (_text, length, final = false) => ({
    boundary: final ? length : Math.min(2, length),
    matchEnds: [],
    suppressed: false,
  });
  const { buffer } = createBuffer({ findSafeBoundary });
  expect(buffer.addText("abcd")).toBe("ab");
  expect(buffer.finish()).toBe("cd");
});

test("suppresses a full pending buffer when no safe boundary can advance", () => {
  let suppressed = false;
  const { buffer, append } = createBuffer({
    findSafeBoundary: () => ({ boundary: 0, matchEnds: [], suppressed: false }),
    canContinue: () => !suppressed,
    suppress: () => {
      suppressed = true;
    },
  });

  expect(buffer.addText("12345678x")).toBe("");
  expect(suppressed).toBe(true);
  expect(buffer.finish()).toBe("");
  expect(append).not.toHaveBeenCalled();
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

test("does not join retained secret-search chunks for each emitted prefix", () => {
  const pendingText = [];
  const createPendingTextChunksFactory = () => {
    const chunks = createPendingTextChunks();
    const toString = jest.fn(() => chunks.toString());
    pendingText.push(toString);
    return {
      ...chunks,
      get length() {
        return chunks.length;
      },
      toString,
    };
  };
  const findSafeBoundary = (_text, final = false) => ({
    boundary: final ? 10 : 0,
    matchEnds: [],
    suppressed: false,
  });
  findSafeBoundary.appendText = (_text, length, final = false) => ({
    boundary: final ? length : Math.max(0, length - 10),
    matchEnds: [],
    suppressed: false,
  });
  const { buffer } = createBuffer({
    pendingLimit: 4,
    bufferLimit: 32,
    findSafeBoundary,
    createPendingTextChunks: createPendingTextChunksFactory,
  });

  buffer.addText("a".repeat(200));
  expect(pendingText[0]).not.toHaveBeenCalled();
  expect(buffer.finish()).toBe("a".repeat(10));
  expect(pendingText[0]).toHaveBeenCalledTimes(1);
});
