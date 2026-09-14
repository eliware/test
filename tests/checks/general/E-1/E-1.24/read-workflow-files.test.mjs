import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readWorkflows } from "../../../../../src/checks/general/E-1/E-1.24/read-workflow-files.mjs";

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
