import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRunbookRecords } from "../../../../src/checks/workspace/E-0.1.110/read-runbook-records.mjs";
import { createRepositoryInventory } from "../../../../src/checks/create-repository-inventory.mjs";

test("reads discovered JSON records", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-runbooks-read-"));
  const file = join(root, "one.json");
  await writeFile(file, JSON.stringify({ id: "one" }));
  await expect(readRunbookRecords([file])).resolves.toEqual([{ file, record: { id: "one" } }]);
  await rm(root, { recursive: true, force: true });
});

test("reads runbook JSON through the shared parsed-document cache", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-runbooks-inventory-"));
  const file = join(root, "one.json");
  await writeFile(file, JSON.stringify({ id: "one" }));
  const inventory = createRepositoryInventory(root);

  await expect(readRunbookRecords([file], inventory)).resolves.toEqual([
    { file, record: { id: "one" } },
  ]);
  await rm(root, { recursive: true, force: true });
});

test("continues reading records after an individual file fails", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-runbooks-partial-"));
  const goodFile = join(root, "good.json");
  await writeFile(goodFile, JSON.stringify({ id: "good" }));
  const result = await readRunbookRecords([join(root, "missing.json"), goodFile]);
  expect(result).toHaveLength(2);
  expect(result[0].file).toBe(join(root, "missing.json"));
  expect(result[0].error.message).toContain("ENOENT");
  expect(result[1]).toEqual({ file: goodFile, record: { id: "good" } });
  await rm(root, { recursive: true, force: true });
});
