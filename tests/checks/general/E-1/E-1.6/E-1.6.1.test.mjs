import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.6/E-1.6.1.mjs";

test("rejects prohibited backup and runtime-state artifacts", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-runtime-state-"));
  await writeFile(join(root, "README.md"), "safe");
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await mkdir(join(root, "backups"));
  await writeFile(join(root, "backups", "database.sql.gz"), "backup");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
});

test("returns the repository discovery error", async () => {
  await expect(run({ root: "C:/repo" }, async () => { throw new Error("discovery failed"); })).resolves.toEqual({
    ruleId: "E-1.6.1",
    status: "fail",
    message: "discovery failed",
  });
});
