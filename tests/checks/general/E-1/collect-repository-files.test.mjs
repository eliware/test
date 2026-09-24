import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectRepositoryFiles } from "../../../../src/checks/general/E-1/collect-repository-files.mjs";

test("collects files recursively and ignores special entries", async () => {
  await expect(collectRepositoryFiles("C:/root", "C:/root", async () => [
    { name: "module.mjs", isDirectory: () => false, isFile: () => true },
    { name: "special", isDirectory: () => false, isFile: () => false },
  ])).resolves.toEqual(["module.mjs"]);
});

test("recursively collects directory entries", async () => {
  await expect(collectRepositoryFiles("C:/root", "C:/root", async (directory) => {
    if (directory.endsWith("nested")) {
      return [{ name: "child.mjs", isDirectory: () => false, isFile: () => true }];
    }
    return [
      { name: "nested", isDirectory: () => true, isFile: () => false },
      { name: "root.mjs", isDirectory: () => false, isFile: () => true },
    ];
  })).resolves.toEqual(["nested/child.mjs", "root.mjs"]);
});

test("uses the directory as the default root and reads real directory entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-files-"));
  await mkdir(join(root, "nested"));
  await writeFile(join(root, "nested", "module.mjs"), "export {};\n");
  try {
    await expect(collectRepositoryFiles(root)).resolves.toEqual(["nested/module.mjs"]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
