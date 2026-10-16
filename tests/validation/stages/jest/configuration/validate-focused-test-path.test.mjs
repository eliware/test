import { beforeEach, expect, jest, test } from "@jest/globals";
import { join, resolve } from "node:path";
import { platform } from "node:os";

const realpath = jest.fn();
const stat = jest.fn();

jest.unstable_mockModule("node:fs/promises", () => ({ realpath, stat }));

const { validateFocusedTestPath } =
  await import("../../../../../src/validation/stages/jest/configuration/validate-focused-test-path.mjs");

const root = resolve("/repo");

beforeEach(() => {
  realpath.mockReset().mockImplementation(async (path) => path);
  stat.mockReset().mockResolvedValue({ isFile: () => true });
});

test("validates focused test paths before execution", async () => {
  await expect(validateFocusedTestPath(root)).resolves.toEqual([]);
  await expect(validateFocusedTestPath(root, ["tests/sample.test.mjs"])).resolves.toEqual([
    "tests/sample.test.mjs",
  ]);
  await expect(validateFocusedTestPath(root, ["tests\\sample.test.mjs"])).resolves.toEqual([
    "tests/sample.test.mjs",
  ]);
  await expect(
    validateFocusedTestPath(root, ["tests/sample.test.mjs", "tests/nested/second.test.mjs"]),
  ).resolves.toEqual(["tests/sample.test.mjs", "tests/nested/second.test.mjs"]);
  realpath.mockImplementation(async (path) => {
    if (path === join(root, "tests", "missing.test.mjs")) throw new Error("missing");
    return path;
  });
  await expect(validateFocusedTestPath(root, ["tests/missing.test.mjs"])).rejects.toThrow(
    "does not exist",
  );
  await expect(validateFocusedTestPath(root, ["tests"])).rejects.toThrow("under tests/");

  stat.mockResolvedValueOnce({ isFile: () => false });
  await expect(validateFocusedTestPath(root, ["tests/directory.test.mjs"])).rejects.toThrow(
    "regular file",
  );
});

const casePathTest = platform() === "win32" ? test : test.skip;
casePathTest("returns the canonical casing accepted by Windows", async () => {
  realpath.mockImplementation(async (path) =>
    path.endsWith("sample.test.mjs") ? join(root, "tests", "Sample.test.mjs") : path,
  );
  await expect(validateFocusedTestPath(root, ["tests/sample.test.mjs"])).resolves.toEqual([
    "tests/Sample.test.mjs",
  ]);
});

test("rejects traversal and symlinks that escape the repository", async () => {
  const outside = resolve("/outside", "linked.test.mjs");
  realpath.mockImplementation(async (path) =>
    path.endsWith(join("external", "linked.test.mjs")) ? outside : path,
  );

  await expect(validateFocusedTestPath(root, ["tests/../../outside.test.mjs"])).rejects.toThrow(
    "must not contain parent-directory traversal",
  );
  await expect(validateFocusedTestPath(root, ["tests/sub/../inside.test.mjs"])).rejects.toThrow(
    "must not contain parent-directory traversal",
  );
  await expect(validateFocusedTestPath(root, ["tests\\sub\\..\\inside.test.mjs"])).rejects.toThrow(
    "must not contain parent-directory traversal",
  );
  await expect(validateFocusedTestPath(root, ["tests/external/linked.test.mjs"])).rejects.toThrow(
    "must resolve inside the repository",
  );
});

test("rejects POSIX, UNC, and drive-qualified absolute test paths", async () => {
  await expect(validateFocusedTestPath(root, ["C:/repo/tests/a.test.mjs"])).rejects.toThrow(
    "must be repository-relative",
  );
  await expect(validateFocusedTestPath(root, ["C:tests\\a.test.mjs"])).rejects.toThrow(
    "must be repository-relative",
  );
  await expect(validateFocusedTestPath(root, ["C:\\repo\\tests\\a.test.mjs"])).rejects.toThrow(
    "must be repository-relative",
  );
  await expect(validateFocusedTestPath(root, ["/repo/tests/a.test.mjs"])).rejects.toThrow(
    "must be repository-relative",
  );
  await expect(
    validateFocusedTestPath(root, ["\\\\server\\share\\repo\\tests\\a.test.mjs"]),
  ).rejects.toThrow("must be repository-relative");
});
