import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { readKnitWorkflowFiles } from "../../../../../src/checks/general/E-0.1/E-0.1.10/read-knit-workflow-files.mjs";

test("reads Knit YAML files recursively and ignores support scripts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-files-"));
  const directory = join(root, ".knit");
  await mkdir(join(directory, "nested"), { recursive: true });
  await writeFile(join(directory, "deploy.yaml"), "commands: []\n");
  await writeFile(join(directory, "check.mjs"), "export {};\n");
  await writeFile(join(directory, "nested", "extra.yml"), "name: extra\n");
  try {
    await expect(readKnitWorkflowFiles(root)).resolves.toEqual([
      ".knit/deploy.yaml",
      ".knit/nested/extra.yml",
    ]);
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("uses the repository inventory when available", async () => {
  const repositoryInventory = {
    repositoryFiles: async () => [".knit/deploy.yaml", ".knit/tool.mjs", "docs/other.yaml"],
  };
  await expect(readKnitWorkflowFiles("/repo", repositoryInventory)).resolves.toEqual([
    ".knit/deploy.yaml",
  ]);
});

test("reports missing Knit directory during fallback discovery", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-knit-files-missing-"));
  try {
    await expect(readKnitWorkflowFiles(root)).rejects.toMatchObject({ code: "ENOENT" });
  } finally {
    await rm(root, { recursive: true, force: true });
  }
});

test("discovers deeply nested workflows without recursive calls", async () => {
  const depth = 2_000;
  let reads = 0;
  const directoryEntry = { name: "nested", isDirectory: () => true, isFile: () => false };
  const workflowEntry = { name: "deploy.yaml", isDirectory: () => false, isFile: () => true };
  const readDirectory = async () => {
    reads += 1;
    return reads <= depth ? [directoryEntry] : [workflowEntry];
  };

  const files = await readKnitWorkflowFiles("/repo", undefined, readDirectory);
  expect(reads).toBe(depth + 1);
  expect(files).toHaveLength(1);
  expect(files[0].match(/nested/gu)).toHaveLength(depth);
  expect(files[0]).toMatch(/\/deploy\.yaml$/u);
});
