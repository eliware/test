import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";
import { collectReadmeFiles } from "../../../../../src/checks/general/E-0.1/E-0.1.1/collect-readme-files.mjs";

test.each([false, true])("collects all README.md files (inventory=%s)", async (useInventory) => {
  const root = await mkdtemp(join(tmpdir(), "eliware-readme-files-"));
  try {
    await mkdir(join(root, "docs"));
    await writeFile(join(root, "README.md"), "# Root");
    await writeFile(join(root, "docs", "README.md"), "# Docs");
    await writeFile(join(root, "docs", "guide.md"), "# Guide");
    await writeFile(join(root, "paths.json"), '{"path":"missing.json"}');
    await writeFile(join(root, "paths.yaml"), "path: missing.yaml");
    const inventory = useInventory ? createRepositoryInventory(root) : undefined;
    await expect(collectReadmeFiles(root, inventory)).resolves.toEqual([
      "docs/README.md",
      "README.md",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
