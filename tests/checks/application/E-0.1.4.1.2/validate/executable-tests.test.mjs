import { expect, jest, test } from "@jest/globals";
import { validateExecutableTests } from "../../../../../src/checks/application/E-0.1.4.1.2/validate/executable-tests.mjs";

test("requires executable Jest tests for mirrored test files", async () => {
  const files = ["tests/a.test.mjs", "tests/support.mjs"];
  const readText = async () => 'test("a", () => {});';
  await expect(validateExecutableTests(files, readText, "repo")).resolves.toEqual([]);
});

test("rejects non-executable and unreadable test files", async () => {
  const files = ["tests/empty.test.mjs", "tests/unreadable.test.mjs"];
  const readText = async (path) => {
    if (path.endsWith("unreadable.test.mjs")) throw new Error("read failed");
    return 'import { value } from "../../src/a.mjs"; // test("comment", () => value);';
  };
  await expect(validateExecutableTests(files, readText, "repo")).resolves.toEqual([
    "tests/empty.test.mjs must declare an executable Jest test.",
    "tests/unreadable.test.mjs must declare an executable Jest test.",
  ]);
});

test("ignores non-test support files", async () => {
  const readText = jest.fn();
  await expect(validateExecutableTests(["tests/support.mjs"], readText, "repo")).resolves.toEqual(
    [],
  );
  expect(readText).not.toHaveBeenCalled();
});
