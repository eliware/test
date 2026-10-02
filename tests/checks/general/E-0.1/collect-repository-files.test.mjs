import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectRepositoryFiles } from "../../../../src/checks/general/E-0.1/collect-repository-files.mjs";

test("collects files recursively and ignores special entries", async () => {
  await expect(
    collectRepositoryFiles("C:/root", "C:/root", async () => [
      { name: "module.mjs", isDirectory: () => false, isFile: () => true },
      { name: "special", isDirectory: () => false, isFile: () => false },
    ]),
  ).resolves.toEqual(["module.mjs"]);
});

test("recursively collects directory entries", async () => {
  await expect(
    collectRepositoryFiles("C:/root", "C:/root", async (directory) => {
      if (directory.endsWith("nested")) {
        return [{ name: "child.mjs", isDirectory: () => false, isFile: () => true }];
      }
      return [
        { name: "nested", isDirectory: () => true, isFile: () => false },
        { name: "root.mjs", isDirectory: () => false, isFile: () => true },
      ];
    }),
  ).resolves.toEqual(["nested/child.mjs", "root.mjs"]);
});

test("prunes generated, dependency, and VCS directories", async () => {
  const visited = [];
  await expect(
    collectRepositoryFiles("C:/root", "C:/root", async (directory) => {
      visited.push(directory);
      return [
        { name: "node_modules", isDirectory: () => true, isFile: () => false },
        { name: "build", isDirectory: () => true, isFile: () => false },
        { name: "source.mjs", isDirectory: () => false, isFile: () => true },
      ];
    }),
  ).resolves.toEqual(["source.mjs"]);
  expect(visited).toEqual(["C:/root"]);
});

test("keeps nested directories whose names are pruned only at the repository root", async () => {
  await expect(
    collectRepositoryFiles("C:/root", "C:/root", async (directory) => {
      if (directory.endsWith("src"))
        return [{ name: "build", isDirectory: () => true, isFile: () => false }];
      if (directory.endsWith("build"))
        return [{ name: "module.mjs", isDirectory: () => false, isFile: () => true }];
      return [{ name: "src", isDirectory: () => true, isFile: () => false }];
    }),
  ).resolves.toEqual(["src/build/module.mjs"]);
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
