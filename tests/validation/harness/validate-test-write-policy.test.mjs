import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const readFile = jest.fn();
const findRepositoryFiles = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));
jest.unstable_mockModule(
  "../../../src/validation/shared/repository/find-repository-files.mjs",
  () => ({ findRepositoryFiles }),
);

const { validateTestWritePolicy } =
  await import("../../../src/validation/harness/validate-test-write-policy.mjs");

beforeEach(() => {
  readFile.mockReset();
  findRepositoryFiles.mockReset();
});

test("checks test sources and ignores files outside test suites", async () => {
  findRepositoryFiles.mockResolvedValue(["tests/clean.test.mjs", "tests/helper.mjs", "README.md"]);
  readFile.mockResolvedValue('import { readFile } from "node:fs/promises";');
  await expect(validateTestWritePolicy("C:/repo")).resolves.toEqual([]);
  expect(findRepositoryFiles).toHaveBeenCalledWith("C:/repo");
  expect(readFile).toHaveBeenCalledTimes(1);
  expect(readFile).toHaveBeenCalledWith(join("C:/repo", "tests/clean.test.mjs"), "utf8");
});

test("returns path and line details for file creation APIs", async () => {
  findRepositoryFiles.mockResolvedValue(["tests/writes.test.mjs"]);
  readFile.mockResolvedValue('import { writeFile } from "node:fs/promises";');
  await expect(validateTestWritePolicy("C:/repo")).resolves.toEqual([
    "tests/writes.test.mjs:1 uses a test API that creates files or temporary directories: import of writeFile.",
  ]);
});
