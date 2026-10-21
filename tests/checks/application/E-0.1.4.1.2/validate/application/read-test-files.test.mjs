import { expect, jest, test } from "@jest/globals";
import { readApplicationTestFiles } from "../../../../../../src/checks/application/E-0.1.4.1.2/validate/application/read-test-files.mjs";

test("selects and reads only Jest test files", async () => {
  const readText = jest.fn(async (path) => path);
  await expect(
    readApplicationTestFiles(
      ["src/a.mjs", "tests/a.test.mjs", "tests/helper.mjs", "tests/b.test.mjs"],
      readText,
      "repo",
    ),
  ).resolves.toEqual([
    { path: "tests/a.test.mjs", content: "repo\\tests\\a.test.mjs", readError: false },
    { path: "tests/b.test.mjs", content: "repo\\tests\\b.test.mjs", readError: false },
  ]);
  expect(readText).toHaveBeenCalledTimes(2);
});

test("records unreadable test files for each applicable validator", async () => {
  const testFiles = await readApplicationTestFiles(
    ["tests/a.test.mjs"],
    async () => {
      throw new Error("read failed");
    },
    "repo",
  );
  expect(testFiles).toEqual([{ path: "tests/a.test.mjs", content: "", readError: true }]);
});
