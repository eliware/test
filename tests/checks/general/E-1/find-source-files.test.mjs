import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findSourceFiles } from "../../../../src/checks/general/E-1/find-source-files.mjs";

test("discovers source files while excluding generated and dependency trees", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-source-files-"));
  await mkdir(join(root, "node_modules"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "value.mjs"), "export const value = 1;");
  await writeFile(join(root, "node_modules", "ignored.mjs"), "export const ignored = 1;");
  await expect(findSourceFiles(root)).resolves.toEqual([join(root, "src", "value.mjs")]);
  await rm(root, { recursive: true, force: true });
});

test("recurses through source directories and ignores unsupported entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-source-files-nested-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "value.mjs"), "export {}; ");
  await expect(
    findSourceFiles(root, async (directory) => {
      if (directory === root) {
        return [
          { name: "src", isDirectory: () => true, isFile: () => false },
          { name: "special", isDirectory: () => false, isFile: () => false },
        ];
      }
      return [
        { name: "value.mjs", isDirectory: () => false, isFile: () => true },
        { name: "notes.txt", isDirectory: () => false, isFile: () => true },
      ];
    }),
  ).resolves.toEqual([join(root, "src", "value.mjs")]);
  await rm(root, { recursive: true, force: true });
});
