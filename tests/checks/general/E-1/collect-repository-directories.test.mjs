import { mkdir, mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { collectRepositoryDirectories } from "../../../../src/checks/general/E-1/collect-repository-directories.mjs";

test("collects nested repository directories in relative form", async () => {
  await expect(
    collectRepositoryDirectories("C:/root", "C:/root", async (directory) =>
      directory === "C:/root"
        ? [{ name: "nested", isDirectory: () => true, isFile: () => false }]
        : [],
    ),
  ).resolves.toEqual(["nested"]);
});

test("ignores non-directory entries", async () => {
  await expect(
    collectRepositoryDirectories("C:/root", "C:/root", async () => [
      { name: "file.mjs", isDirectory: () => false, isFile: () => true },
    ]),
  ).resolves.toEqual([]);
});

test("uses the filesystem defaults when no adapter is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-directories-"));
  await mkdir(join(root, "nested"));
  await expect(collectRepositoryDirectories(root)).resolves.toEqual(["nested"]);
  await rm(root, { recursive: true, force: true });
});
