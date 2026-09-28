import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { collectNoCoverageIgnoreSourceFiles } from "../../../../src/checks/general/E-0.1/collect-no-coverage-ignore-source-files.mjs";

test("discovers supported source files without repository inventory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-coverage-sources-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "source.mjs"), "export {};\n");
  await writeFile(join(root, "src", "notes.txt"), "notes\n");
  try {
    await expect(collectNoCoverageIgnoreSourceFiles(root)).resolves.toEqual([
      join(root, "src", "source.mjs"),
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("selects supported files from the repository inventory", async () => {
  const root = "C:/repo";
  const repositoryInventory = {
    entriesUnder: async () => [
      { path: "src/index.ts", type: "file" },
      { path: "src/index.cts", type: "file" },
      { path: "src/nested", type: "directory" },
    ],
  };

  await expect(collectNoCoverageIgnoreSourceFiles(root, repositoryInventory)).resolves.toEqual([
    join(root, "src/index.ts"),
  ]);
});
