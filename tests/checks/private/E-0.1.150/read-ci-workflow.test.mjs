import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readCiWorkflow } from "../../../../src/checks/private/E-0.1.150/read-ci-workflow.mjs";

test("reads the private repository CI workflow", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-read-ci-"));
  const directory = join(root, ".github", "workflows");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "ci.yml"), "jobs:\n  test:\n    steps: []\n");
  await expect(readCiWorkflow({ root })).resolves.toEqual({
    name: "ci.yml",
    document: { jobs: { test: { steps: [] } } },
  });
  await rm(root, { recursive: true, force: true });
});

test("rejects a non-mapping workflow document", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-read-ci-invalid-"));
  const directory = join(root, ".github", "workflows");
  await mkdir(directory, { recursive: true });
  await writeFile(join(directory, "ci.yml"), "- one\n- two\n");
  await expect(readCiWorkflow({ root })).rejects.toThrow("must contain a YAML mapping");
  await rm(root, { recursive: true, force: true });
});

test("uses repository inventory to parse the workflow", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-read-ci-inventory-"));
  const repositoryInventory = {
    readParsed: async (path, format, parse) => {
      expect(path).toBe(join(root, ".github", "workflows", "ci.yml"));
      expect(format).toBe("yaml-document");
      return parse("jobs:\n  test:\n    steps: []\n");
    },
  };
  await expect(readCiWorkflow({ root, repositoryInventory })).resolves.toEqual({
    name: "ci.yml",
    document: { jobs: { test: { steps: [] } } },
  });
  await rm(root, { recursive: true, force: true });
});
