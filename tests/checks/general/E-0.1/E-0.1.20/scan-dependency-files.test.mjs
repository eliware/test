import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { scanDependencyFiles } from "../../../../../src/checks/general/E-0.1/E-0.1.20/scan-dependency-files.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

test("scans source and structured dependency references", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-dependency-scan-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "import x from 'dep'; export { x };");
  await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { dep: "1.0.0" } }));
  const referenced = new Set();
  const uncertain = { value: false };
  await scanDependencyFiles(root, ["dep"], referenced, uncertain);
  expect(referenced.has("dep")).toBe(true);
  await rm(root, { recursive: true, force: true });
});

test("uses the shared file list and skips non-source files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-dependency-scan-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), "import x from 'dep'; export { x };" );
  await writeFile(join(root, "README.md"), "dep");
  const referenced = new Set();
  await scanDependencyFiles(root, ["dep"], referenced, { value: false }, ["src/module.mjs", "tests/example.mjs", "README.md"]);
  expect(referenced.has("dep")).toBe(true);
  await rm(root, { recursive: true, force: true });
});

test("uses shared AST and JSON caches when the inventory is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-dependency-inventory-scan-"));
  await mkdir(join(root, "src"));
  await writeFile(join(root, "src", "module.mjs"), 'import x from "dep"; export { x };');
  await writeFile(join(root, "src", "typed.ts"), 'import x from "dep"; export { x };');
  await writeFile(join(root, "package.json"), JSON.stringify({ dependencies: { dep: "1.0.0" } }));
  const inventory = createRepositoryInventory(root);
  const files = await inventory.repositoryFiles();
  const referenced = new Set();
  const uncertain = { value: false };

  await scanDependencyFiles(
    root,
    ["dep"],
    referenced,
    uncertain,
    files,
    inventory.parseAst,
    inventory,
  );
  expect(referenced.has("dep")).toBe(true);
  await rm(root, { recursive: true, force: true });
});
