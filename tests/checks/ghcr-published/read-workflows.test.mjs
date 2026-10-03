import { expect, jest, test } from "@jest/globals";
import { mkdir, mkdtemp, readFile, readdir, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readWorkflows } from "../../../src/checks/ghcr-published/read-workflows.mjs";
import { createRepositoryInventory } from "../../../src/checks/create-repository-inventory.mjs";

test("loads workflows without caching when no context or inventory is supplied", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workflow-uncached-"));
  const workflowsDirectory = join(root, ".github", "workflows");
  await mkdir(workflowsDirectory, { recursive: true });
  const workflowPath = join(workflowsDirectory, "ci.yaml");
  await writeFile(workflowPath, "name: first\n");
  try {
    const first = readWorkflows(root);
    await expect(first).resolves.toEqual([
      expect.objectContaining({ document: expect.objectContaining({ name: "first" }) }),
    ]);
    await writeFile(workflowPath, "name: second\n");
    await expect(readWorkflows(root)).resolves.toEqual([
      expect.objectContaining({ document: expect.objectContaining({ name: "second" }) }),
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("reloads changed workflow content within a validation context", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workflow-cache-"));
  const workflowsDirectory = join(root, ".github", "workflows");
  await mkdir(workflowsDirectory, { recursive: true });
  const workflowPath = join(workflowsDirectory, "ci.yaml");
  await writeFile(workflowPath, "name: first\n");

  try {
    const context = {};
    const first = readWorkflows(root, context);
    await expect(first).resolves.toEqual([
      expect.objectContaining({
        name: "ci.yaml",
        document: expect.objectContaining({ name: "first" }),
      }),
    ]);

    await writeFile(workflowPath, "name: changed\n");
    await expect(readWorkflows(root, context)).resolves.toEqual([
      expect.objectContaining({
        name: "ci.yaml",
        document: expect.objectContaining({ name: "changed" }),
      }),
    ]);
    await expect(readWorkflows(root, {})).resolves.toEqual([
      expect.objectContaining({
        name: "ci.yaml",
        document: expect.objectContaining({ name: "changed" }),
      }),
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("shares a workflow load across contexts using the same repository inventory", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workflow-inventory-"));
  const workflowsDirectory = join(root, ".github", "workflows");
  await mkdir(workflowsDirectory, { recursive: true });
  const workflowPath = join(workflowsDirectory, "ci.yaml");
  await writeFile(workflowPath, "name: ci\njobs: {}\n");
  const reads = new Map();
  const repositoryInventory = createRepositoryInventory(root, {
    expandedDirectories: [".github"],
    readDirectory: readdir,
    read: async (path, encoding) => {
      reads.set(path, (reads.get(path) ?? 0) + 1);
      return readFile(path, encoding);
    },
  });
  const context = { repositoryInventory };
  try {
    const normalized = readWorkflows(root, context);
    const repeated = readWorkflows(root, { repositoryInventory });
    expect(repeated).not.toBe(normalized);
    await expect(normalized).resolves.toEqual([
      expect.objectContaining({
        name: "ci.yaml",
        content: "name: ci\njobs: {}\n",
        document: { name: "ci", jobs: {} },
      }),
    ]);
    expect(reads.get(workflowPath)).toBe(1);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("retries an inventory-backed workflow load after a transient failure", async () => {
  const entries = [{ name: "ci.yaml", isFile: () => true }];
  const inventory = {
    directoryEntries: jest
      .fn()
      .mockRejectedValueOnce(new Error("transient read failure"))
      .mockResolvedValue(entries),
    readText: jest.fn().mockResolvedValue("name: ci\\njobs: {}\\n"),
    readParsed: jest.fn().mockResolvedValue({ name: "ci", jobs: {} }),
  };
  const context = { repositoryInventory: inventory };

  await expect(readWorkflows("/repo", context)).rejects.toThrow("transient read failure");
  await expect(readWorkflows("/repo", context)).resolves.toEqual([
    expect.objectContaining({ name: "ci.yaml" }),
  ]);
  expect(inventory.directoryEntries).toHaveBeenCalledTimes(2);
});

test("retries a context-backed workflow load after its workflow directory is created", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workflow-context-retry-"));
  const context = {};
  try {
    await expect(readWorkflows(root, context)).rejects.toThrow();
    const workflowsDirectory = join(root, ".github", "workflows");
    await mkdir(workflowsDirectory, { recursive: true });
    await writeFile(join(workflowsDirectory, "ci.yaml"), "name: ci\n");
    await expect(readWorkflows(root, context)).resolves.toEqual([
      expect.objectContaining({ name: "ci.yaml" }),
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
