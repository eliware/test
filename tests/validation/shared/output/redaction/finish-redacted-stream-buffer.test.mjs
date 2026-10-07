import { expect, jest, test } from "@jest/globals";
import { createPendingTextChunks } from "../../../../../src/validation/shared/output/redaction/create-pending-text-chunks.mjs";
import { finishRedactedStreamBuffer } from "../../../../../src/validation/shared/output/redaction/finish-redacted-stream-buffer.mjs";

const boundary = () => ({ matchEnds: [], suppressed: false });

test("finishes a string buffer and appends decoder output", () => {
  const append = jest.fn((text) => text);
  const findSafeBoundary = jest.fn(boundary);
  const result = finishRedactedStreamBuffer({
    pending: "pending",
    decoder: { end: () => " tail" },
    findSafeBoundary,
    trimSuffix: (text) => text,
    append,
    suppress: jest.fn(),
  });
  expect(result).toBe("pending tail");
  expect(findSafeBoundary).toHaveBeenCalledWith("pending tail", true);
  expect(append).toHaveBeenCalledWith("pending tail", []);
});

test("finishes chunked buffers through the incremental boundary scanner", () => {
  const pendingChunks = createPendingTextChunks();
  pendingChunks.append("pending");
  const findSafeBoundary = { appendText: jest.fn(boundary) };
  const result = finishRedactedStreamBuffer({
    pendingChunks,
    decoder: { end: () => " tail" },
    findSafeBoundary,
    trimSuffix: (text) => text,
    append: (text) => text,
    suppress: jest.fn(),
  });
  expect(result).toBe("pending tail");
  expect(findSafeBoundary.appendText).toHaveBeenCalledWith(" tail", 12, true);
  expect(pendingChunks.length).toBe(0);
});

test("suppresses unsafe final text and clears retained chunks", () => {
  const pendingChunks = createPendingTextChunks();
  pendingChunks.append("secret");
  const suppress = jest.fn();
  const append = jest.fn();
  const result = finishRedactedStreamBuffer({
    pendingChunks,
    decoder: { end: () => "" },
    findSafeBoundary: { appendText: () => ({ suppressed: true }) },
    trimSuffix: (text) => text,
    append,
    suppress,
  });
  expect(result).toBe("");
  expect(suppress).toHaveBeenCalledTimes(1);
  expect(append).not.toHaveBeenCalled();
  expect(pendingChunks.length).toBe(0);
});
