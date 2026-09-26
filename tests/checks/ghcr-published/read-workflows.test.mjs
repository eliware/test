import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readWorkflows } from "../../../src/checks/ghcr-published/read-workflows.mjs";
import { readWorkflows as readGeneralWorkflows } from "../../../src/checks/general/E-0.1/E-0.1.24/read-workflow-files.mjs";
import { createRepositoryInventory } from "../../../src/checks/create-repository-inventory.mjs";

test("discovers workflow files and preserves their names and contents", async () => {
  await expect(readWorkflows(process.cwd())).resolves.toEqual(
    expect.arrayContaining([
      expect.objectContaining({
        name: expect.stringMatching(/\.ya?ml$/i),
        content: expect.any(String),
        document: expect.any(Object),
      }),
    ]),
  );
});

test("shares one parsed workflow result within a validation context", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workflow-cache-"));
  const workflowsDirectory = join(root, ".github", "workflows");
  await mkdir(workflowsDirectory, { recursive: true });
  const workflowPath = join(workflowsDirectory, "ci.yml");
  await writeFile(workflowPath, "name: first\n");

  try {
    const context = {};
    const first = readWorkflows(root, context);
    const concurrent = readWorkflows(root, context);

    expect(concurrent).toBe(first);
    await expect(first).resolves.toEqual([
      expect.objectContaining({
        name: "ci.yml",
        document: expect.objectContaining({ name: "first" }),
      }),
    ]);

    await writeFile(workflowPath, "name: changed\n");
    expect(readWorkflows(root, context)).toBe(first);
    await expect(readWorkflows(root, {})).resolves.toEqual([
      expect.objectContaining({
        name: "ci.yml",
        document: expect.objectContaining({ name: "changed" }),
      }),
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("shares workflow discovery, source text, and parsed YAML through the run inventory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workflow-inventory-"));
  const workflowsDirectory = join(root, ".github", "workflows");
  await mkdir(workflowsDirectory, { recursive: true });
  const workflowPath = join(workflowsDirectory, "ci.yml");
  await writeFile(workflowPath, "name: ci\njobs: {}\n");
  const reads = new Map();
  const directories = [];
  const repositoryInventory = createRepositoryInventory(root, {
    expandedDirectories: [".github"],
    readDirectory: async (directory, options) => {
      directories.push(directory);
      return readdir(directory, options);
    },
    read: async (path, encoding) => {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readFile(path, encoding);
    },
  });
  const context = { repositoryInventory };
  try {
    const raw = await readGeneralWorkflows(root, repositoryInventory);
    const normalized = await readWorkflows(root, context);
    const repeated = await readWorkflows(root, context);
    expect(raw[0].document).toEqual({ name: "ci", jobs: {} });
    expect(normalized[0].content).toBe("name: ci\njobs: {}\n");
    expect(repeated[0].document).toEqual(normalized[0].document);
    expect(reads.get(workflowPath)).toBe(1);
    expect(directories).toEqual([workflowsDirectory]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
