import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readWorkflows } from "../../../src/checks/ghcr-published/read-workflows.mjs";

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
