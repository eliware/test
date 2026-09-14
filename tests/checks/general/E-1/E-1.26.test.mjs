import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { ruleId, run } from "../../../../src/checks/general/E-1/E-1.26.mjs";

test("passes with the approved license record", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-license-"));
  await writeFile(join(root, "LICENSE"), "MIT License\nCopyright (c) 2026 Eliware\nPermission is hereby granted");
  await expect(run({ root })).resolves.toEqual({ ruleId, status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("reports missing approved license markers", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-license-missing-"));
  await writeFile(join(root, "LICENSE"), "MIT License\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({
    ruleId,
    status: "fail",
    message: expect.stringContaining("Copyright"),
  }));
  await rm(root, { recursive: true, force: true });
});

test("fails when the license file is unavailable", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-license-absent-"));
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ ruleId, status: "fail" }));
  await rm(root, { recursive: true, force: true });
});
