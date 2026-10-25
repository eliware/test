import { expect, jest, test } from "@jest/globals";
import { join, resolve } from "node:path";

const lstat = jest.fn();
jest.unstable_mockModule("node:fs/promises", () => ({ lstat }));
const { inspectEntrypointTargetFilesystem } =
  await import("../../../../../../src/checks/application/E-0.1.4.1.1/validate/entrypoint/inspect-target-filesystem.mjs");

const file = { isFile: () => true, isDirectory: () => false, isSymbolicLink: () => false };
const directory = { isFile: () => false, isDirectory: () => true, isSymbolicLink: () => false };

test("accepts a file after checking each directory segment", async () => {
  const checked = [];
  await expect(
    inspectEntrypointTargetFilesystem("bin/tool.mjs", "repo", async (path) => {
      checked.push(path);
      return path.endsWith(join("bin", "tool.mjs")) ? file : directory;
    }),
  ).resolves.toBeNull();
  expect(checked).toEqual([
    resolve("repo"),
    join(resolve("repo"), "bin"),
    join(resolve("repo"), "bin", "tool.mjs"),
  ]);
});

test("uses the default filesystem reader", async () => {
  lstat.mockImplementation(async (path) =>
    path.endsWith(join("bin", "tool.mjs")) ? file : directory,
  );
  await expect(inspectEntrypointTargetFilesystem("bin/tool.mjs", "repo")).resolves.toBeNull();
  expect(lstat).toHaveBeenCalledTimes(3);
});

test("rejects a symlink at the root or in a target segment", async () => {
  await expect(
    inspectEntrypointTargetFilesystem("bin/tool.mjs", "repo", async (path) =>
      path === resolve("repo") ? { ...directory, isSymbolicLink: () => true } : file,
    ),
  ).resolves.toBe("symlink");
  await expect(
    inspectEntrypointTargetFilesystem("bin/link/tool.mjs", "repo", async (path) =>
      path.endsWith(join("bin", "link")) ? { ...directory, isSymbolicLink: () => true } : directory,
    ),
  ).resolves.toBe("symlink");
});

test("requires directories between the root and target file", async () => {
  await expect(
    inspectEntrypointTargetFilesystem("bin/tool.mjs", "repo", async () => file),
  ).resolves.toBe("directory");
  await expect(
    inspectEntrypointTargetFilesystem("bin/tool.mjs", "repo", async (path) =>
      path.endsWith(join("bin")) ? directory : { ...file, isFile: () => false },
    ),
  ).resolves.toBe("file");
});

test("reports file system read failures", async () => {
  await expect(
    inspectEntrypointTargetFilesystem("bin/missing.mjs", "repo", async () => {
      throw new Error("missing");
    }),
  ).resolves.toBe("missing");
});
