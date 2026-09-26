import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { findJestConfigFiles } from "../../../../../src/checks/general/E-0.1/E-0.1.20/find-jest-config-files.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

test("finds separate Jest configurations and skips excluded directories", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-config-"));
  await mkdir(join(root, "nested"));
  await mkdir(join(root, "node_modules"));
  await writeFile(join(root, "jest.config.mjs"), "export default {};\n");
  await writeFile(join(root, "nested", "notes.txt"), "not a config\n");
  await writeFile(join(root, "node_modules", "jest.config.js"), "module.exports = {};\n");
  await expect(findJestConfigFiles(root)).resolves.toEqual([join(root, "jest.config.mjs")]);
  await rm(root, { recursive: true, force: true });
});

test("uses repository inventory entries including test-results while pruning dependencies", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-inventory-"));
  await mkdir(join(root, "test-results", "nested"), { recursive: true });
  await mkdir(join(root, "node_modules"), { recursive: true });
  await writeFile(join(root, "jest.config.mjs"), "export default {};\n");
  await writeFile(join(root, "test-results", "nested", "jest.config.js"), "module.exports = {};\n");
  await writeFile(join(root, "node_modules", "jest.config.js"), "module.exports = {};\n");
  const repositoryInventory = createRepositoryInventory(root, { includeTestResults: true });
  await expect(findJestConfigFiles(root, repositoryInventory)).resolves.toEqual([
    join(root, "jest.config.mjs"),
    join(root, "test-results", "nested", "jest.config.js"),
  ]);
  await rm(root, { recursive: true, force: true });
});

test("limits an inventory directory to its repository subtree", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-subtree-"));
  await mkdir(join(root, "nested"), { recursive: true });
  await writeFile(join(root, "jest.config.mjs"), "export default {};\n");
  await writeFile(join(root, "nested", "jest.config.cjs"), "module.exports = {};\n");
  const repositoryInventory = createRepositoryInventory(root);
  await expect(findJestConfigFiles(join(root, "nested"), repositoryInventory)).resolves.toEqual([
    join(root, "nested", "jest.config.cjs"),
  ]);
  await rm(root, { recursive: true, force: true });
});

test("rejects inventory directories outside the repository or missing from it", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-jest-invalid-dir-"));
  const repositoryInventory = createRepositoryInventory(root);
  await expect(findJestConfigFiles(join(root, "..", "outside"), repositoryInventory)).rejects.toThrow(
    "must be inside the repository",
  );
  await expect(findJestConfigFiles(join(root, "missing"), repositoryInventory)).rejects.toMatchObject({
    code: "ENOENT",
  });
  await rm(root, { recursive: true, force: true });
});
