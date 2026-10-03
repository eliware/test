import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, symlink, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { basename, join } from "node:path";
import { platform } from "node:os";
import { validateFocusedTestPath } from "../../../../../src/checks/general/E-0.1/E-0.1.20/validate-focused-test-path.mjs";

test("validates focused test paths before execution", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-test-"));
  await mkdir(join(root, "tests"));
  await writeFile(join(root, "tests", "sample.test.mjs"), 'test("sample", () => {});');
  await expect(validateFocusedTestPath(root)).resolves.toBeNull();
  await expect(validateFocusedTestPath(root, ["tests/sample.test.mjs"])).resolves.toBe(
    "tests/sample.test.mjs",
  );
  await expect(validateFocusedTestPath(root, ["tests\\sample.test.mjs"])).resolves.toBe(
    "tests/sample.test.mjs",
  );
  await expect(validateFocusedTestPath(root, ["tests/missing.test.mjs"])).rejects.toThrow(
    "does not exist",
  );
  await expect(validateFocusedTestPath(root, ["tests"])).rejects.toThrow("regular file");
  await rm(root, { recursive: true, force: true });
});

const casePathTest = platform() === "win32" ? test : test.skip;
casePathTest("returns the canonical casing accepted by Windows", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-case-"));
  const tests = join(root, "tests");
  await mkdir(tests);
  await writeFile(join(tests, "Sample.test.mjs"), "test('sample', () => {});\n");
  try {
    await expect(validateFocusedTestPath(root, ["tests/sample.test.mjs"])).resolves.toBe(
      "tests/Sample.test.mjs",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("rejects traversal and symlinks that escape the repository", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-root-"));
  const outside = await mkdtemp(join(tmpdir(), "eliware-focused-outside-"));
  const outsideFile = join(tmpdir(), `eliware-outside-${Date.now()}.test.mjs`);
  const tests = join(root, "tests");
  await mkdir(tests);
  await writeFile(outsideFile, "test('outside', () => {});");
  await writeFile(join(outside, "linked.test.mjs"), "test('linked', () => {});");
  try {
    await symlink(outside, join(tests, "external"), "junction");
    await expect(
      validateFocusedTestPath(root, [`tests/../../${basename(outsideFile)}`]),
    ).rejects.toThrow("must not contain parent-directory traversal");
    await writeFile(join(tests, "inside.test.mjs"), "test('inside', () => {});");
    await expect(validateFocusedTestPath(root, ["tests/sub/../inside.test.mjs"])).rejects.toThrow(
      "must not contain parent-directory traversal",
    );
    await expect(
      validateFocusedTestPath(root, ["tests\\sub\\..\\inside.test.mjs"]),
    ).rejects.toThrow("must not contain parent-directory traversal");
    await expect(validateFocusedTestPath(root, ["tests/external/linked.test.mjs"])).rejects.toThrow(
      "must resolve inside the repository",
    );
  } finally {
    await rm(root, { recursive: true, force: true });
    await rm(outside, { recursive: true, force: true });
    await rm(outsideFile, { force: true });
  }
});

test("rejects POSIX, UNC, and drive-qualified absolute test paths", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-focused-absolute-"));
  try {
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
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
