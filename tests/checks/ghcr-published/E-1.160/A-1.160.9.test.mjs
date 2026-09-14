import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/ghcr-published/E-1.160/A-1.160.9.mjs";

test("requires operations, GitOps, and handoff boundaries in AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ghcr-handoff-"));
  await writeFile(join(root, "AGENTS.md"), "Operations GitOps handoff");
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.160.9", status: "pass", message: "" });
  await writeFile(join(root, "AGENTS.md"), "Operations only");
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("fails when the handoff document is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ghcr-handoff-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.160.9",
    status: "fail",
    message: "AGENTS.md is required for GHCR handoff boundaries.",
  });
  await rm(root, { recursive: true, force: true });
});
