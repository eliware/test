import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { discoverSourceFiles } from "../../../../../src/checks/general/E-1/E-1.20/discover-source-files.mjs";

test("discovers nested mjs files and excludes generated/dependency directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-source-files-"));
  await mkdir(join(root, "nested"), { recursive: true });
  await mkdir(join(root, "dist"));
  await writeFile(join(root, "entry.mjs"), "");
  await writeFile(join(root, "nested", "child.mjs"), "");
  await writeFile(join(root, "dist", "ignored.mjs"), "");
  await writeFile(join(root, "notes.txt"), "");
  await expect(discoverSourceFiles(root)).resolves.toEqual([
    join(root, "entry.mjs"),
    join(root, "nested", "child.mjs"),
  ]);
  await rm(root, { recursive: true, force: true });
});
