import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { loadRunbookRecords } from "../../../../src/checks/workspace/E-0.1.110/load-runbook-records.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("loads the runbook index and records", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-runbooks-"));
  await mkdir(join(root, "runbooks"));
  await writeFile(join(root, "runbooks", "README.md"), "index");
  await writeFile(join(root, "runbooks", "one.json"), "not read by surface discovery");
  const result = await loadRunbookRecords(root);
  expect(result.files).toHaveLength(1);
  await rm(root, { recursive: true, force: true });
});

test("uses shared file discovery and reads for runbook indexes", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-runbooks-inventory-"));
  await mkdir(join(root, "runbooks"));
  await writeFile(join(root, "runbooks", "README.md"), "index");
  await writeFile(join(root, "runbooks", "one.json"), "{}");
  const repositoryInventory = createRepositoryInventory(root);

  await expect(loadRunbookRecords(root, { repositoryInventory })).resolves.toMatchObject({
    files: [join(root, "runbooks", "one.json")],
  });
  await rm(root, { recursive: true, force: true });
});
