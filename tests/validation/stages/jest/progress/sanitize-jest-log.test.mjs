import { beforeEach, expect, jest, test } from "@jest/globals";

const readFile = jest.fn();
const writeFile = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile, writeFile }));

const { sanitizeJestLog } =
  await import("../../../../../src/validation/stages/jest/progress/sanitize-jest-log.mjs");

beforeEach(() => {
  readFile.mockReset();
  writeFile.mockReset().mockResolvedValue(undefined);
});

test("removes reporter records from the saved log", async () => {
  readFile.mockResolvedValue(
    'PASS tests/example.test.mjs\n[eliware-test-progress] {"event":"done"}\nTests: 1 passed\n',
  );

  await sanitizeJestLog("coverage/jest.log");

  expect(readFile).toHaveBeenCalledWith("coverage/jest.log", "utf8");
  expect(writeFile).toHaveBeenCalledWith(
    "coverage/jest.log",
    "PASS tests/example.test.mjs\nTests: 1 passed\n",
    "utf8",
  );
});

test("does not rewrite logs without reporter records", async () => {
  readFile.mockResolvedValue("PASS tests/example.test.mjs\n");

  await sanitizeJestLog("coverage/jest.log");

  expect(writeFile).not.toHaveBeenCalled();
});

test("uses injected file operations", async () => {
  const read = jest.fn().mockResolvedValue("[eliware-test-progress] done\n");
  const write = jest.fn().mockResolvedValue(undefined);

  await sanitizeJestLog("coverage/jest.log", { read, write });

  expect(read).toHaveBeenCalledWith("coverage/jest.log", "utf8");
  expect(write).toHaveBeenCalledWith("coverage/jest.log", "", "utf8");
});
