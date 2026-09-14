import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { readRunbookRecords } from "../../../../src/checks/workspace/E-1.110/read-runbook-records.mjs";

test("reads discovered JSON records", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-runbooks-read-"));
  const file = join(root, "one.json");
  await writeFile(file, JSON.stringify({ id: "one" }));
  await expect(readRunbookRecords([file])).resolves.toEqual([{ file, record: { id: "one" } }]);
  await rm(root, { recursive: true, force: true });
});
