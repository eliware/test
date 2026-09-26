import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readWorkflows } from "../../../../../src/checks/general/E-0.1/E-0.1.24/read-workflow-files.mjs";
import { createRepositoryInventory } from "../../../../../src/checks/create-repository-inventory.mjs";

test("reads sorted YAML workflow files and ignores non-YAML entries", async () => {
  const root = await mkdtemp(join(tmpdir(), "test-workflows-"));
  const workflows = join(root, ".github", "workflows");
  await mkdir(workflows, { recursive: true });
  await writeFile(join(workflows, "z.yml"), "name: z\njobs: {}\n");
  await writeFile(join(workflows, "a.yaml"), "name: a\njobs: {}\n");
  await writeFile(join(workflows, "README.md"), "ignored\n");
  expect(await readWorkflows(root)).toEqual([
    { name: "a.yaml", document: { name: "a", jobs: {} } },
    { name: "z.yml", document: { name: "z", jobs: {} } },
  ]);
});

test("reads and parses workflows through the run inventory cache", async () => {
  const root = await mkdtemp(join(tmpdir(), "test-workflows-inventory-"));
  const workflows = join(root, ".github", "workflows");
  await mkdir(workflows, { recursive: true });
  await writeFile(join(workflows, "ci.yml"), "name: ci\njobs: {}\n");
  const reads = new Map();
  const repositoryInventory = createRepositoryInventory(root, {
    expandedDirectories: [".github"],
    read: async (path, encoding) => {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readFile(path, encoding);
    },
  });
  const first = await readWorkflows(root, repositoryInventory);
  const second = await readWorkflows(root, repositoryInventory);
  expect(first).toEqual([{ name: "ci.yml", document: { name: "ci", jobs: {} } }]);
  expect(second[0].document).toBe(first[0].document);
  expect(reads.get(join(workflows, "ci.yml"))).toBe(1);
  await rm(root, { recursive: true, force: true });
});
