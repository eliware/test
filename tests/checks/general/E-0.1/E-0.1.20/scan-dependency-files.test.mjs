import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanDependencyFiles } from "../../../../../src/checks/general/E-0.1/E-0.1.20/scan-dependency-files.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

test("coordinates source and structured scans using shared inventory caches", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-dependency-scan-"));
  try {
    await mkdir(join(root, "src"));
    await mkdir(join(root, "tests"));
    await writeFile(
      join(root, "src", "module.mjs"),
      'import dependency from "dep"; export { dependency };',
    );
    await writeFile(
      join(root, "tests", "ignored.mjs"),
      'import dependency from "other"; export { dependency };',
    );
    await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { dep: "1.0.0" } }));
    const inventory = createRepositoryInventory(root);
    const files = await inventory.repositoryFiles();
    const referenced = new Set();

    await scanDependencyFiles(
      root,
      ["dep", "other"],
      referenced,
      { value: false },
      files,
      inventory.parseAst,
      inventory,
    );

    expect(referenced).toEqual(new Set(["dep"]));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("discovers repository files when no prebuilt file inventory is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-dependency-discovery-"));
  try {
    await mkdir(join(root, "src"));
    await writeFile(
      join(root, "src", "module.mjs"),
      "import dependency from 'dep'; export { dependency };",
    );
    await writeFile(join(root, "package.json"), JSON.stringify({ scripts: { build: "dep" } }));
    const referenced = new Set();

    await scanDependencyFiles(root, ["dep"], referenced, { value: false });

    expect(referenced).toEqual(new Set(["dep"]));
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
