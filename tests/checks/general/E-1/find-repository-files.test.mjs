import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findRepositoryFiles } from "../../../../src/checks/general/E-1/find-repository-files.mjs";

test("discovers repository files while excluding dependency and generated trees", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-repository-files-"));
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, "README.md"), "readme");
  await writeFile(join(root, "node_modules", "ignored.txt"), "ignored");
  await expect(findRepositoryFiles(root)).resolves.toEqual(["README.md"]);
  await rm(root, { recursive: true, force: true });
});

test("recurses through included directories and ignores non-file entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-repository-files-nested-"));
  await mkdir(join(root, "docs"));
  await writeFile(join(root, "docs", "guide.md"), "guide");
  await expect(
    findRepositoryFiles(root, async (directory) => {
      if (directory === root) {
        return [
          { name: "docs", isDirectory: () => true, isFile: () => false },
          { name: "special", isDirectory: () => false, isFile: () => false },
        ];
      }
      return [{ name: "guide.md", isDirectory: () => false, isFile: () => true }];
    }),
  ).resolves.toEqual(["docs/guide.md"]);
  await rm(root, { recursive: true, force: true });
});
