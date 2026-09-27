import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadWorkflows } from "../../../src/checks/ghcr-published/load-workflows.mjs";

test("loads YAML workflow files and normalizes documents", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-load-workflows-"));
  const directory = join(root, ".github", "workflows");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "ci.yml"), "name: ci\njobs:\n  test:\n    runs-on: ubuntu-latest\n");
  await writeFile(join(directory, "notes.txt"), "ignored");
  try {
    await expect(loadWorkflows(root)).resolves.toEqual([{
      name: "ci.yml",
      content: "name: ci\njobs:\n  test:\n    runs-on: ubuntu-latest\n",
      document: { name: "ci", jobs: { test: { "runs-on": "ubuntu-latest" } } },
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses inventory discovery, text, and parsed-content collaborators", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-load-workflows-inventory-"));
  const directory = join(root, ".github", "workflows");
  await mkdir(directory, { recursive: true });
  const file = join(directory, "ci.yaml");
  const content = "name: ci\n";
  await writeFile(file, content);
  const inventory = {
    directoryEntries: async () => [{ name: "ci.yaml", isFile: () => true }],
    readText: async () => content,
    readParsed: async () => ({ name: "ci" }),
  };
  try {
    await expect(loadWorkflows(root, inventory)).resolves.toEqual([{
      name: "ci.yaml",
      content,
      document: { name: "ci", on: undefined, jobs: {} },
    }]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});
