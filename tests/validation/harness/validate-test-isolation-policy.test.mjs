import { beforeEach, expect, jest, test } from "@jest/globals";
import { join } from "node:path";

const readFile = jest.fn();
const findRepositoryFiles = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ readFile }));
jest.unstable_mockModule(
  "../../../src/validation/shared/repository/find-repository-files.mjs",
  () => ({ findRepositoryFiles }),
);

const { validateTestIsolationPolicy } =
  await import("../../../src/validation/harness/validate-test-isolation-policy.mjs");

beforeEach(() => {
  readFile.mockReset();
  findRepositoryFiles.mockReset();
});

test("checks test sources and ignores files outside test suites", async () => {
  findRepositoryFiles.mockResolvedValue(["tests/clean.test.mjs", "tests/helper.mjs", "README.md"]);
  readFile.mockResolvedValue(
    'jest.mock("node:fs/promises"); import { readFile } from "node:fs/promises";',
  );
  await expect(validateTestIsolationPolicy("C:/repo")).resolves.toEqual([]);
  expect(findRepositoryFiles).toHaveBeenCalledWith("C:/repo");
  expect(readFile).toHaveBeenCalledTimes(1);
  expect(readFile).toHaveBeenCalledWith(join("C:/repo", "tests/clean.test.mjs"), "utf8");
});

test("returns path and line details for file creation APIs", async () => {
  findRepositoryFiles.mockResolvedValue(["tests/writes.test.mjs"]);
  readFile.mockResolvedValue(
    'jest.mock("node:fs/promises");\nimport { writeFile } from "node:fs/promises";\nfetch("https://outside.example");',
  );
  await expect(validateTestIsolationPolicy("C:/repo")).resolves.toEqual([
    "tests/writes.test.mjs: must mock fetch, inject it, or use a localhost URL.",
  ]);
});
