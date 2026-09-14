import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/workspace/E-1.110/A-1.110.0.mjs";

test("requires workspace guidance in AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workspace-agents-"));
  await writeFile(
    join(root, "AGENTS.md"),
    "workspace role boundary communication runbook validation",
  );
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.110.0",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports incomplete guidance and missing files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workspace-agents-"));
  await writeFile(join(root, "AGENTS.md"), "workspace role boundary");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.110.0",
    status: "fail",
    message: "AGENTS.md is missing workspace topics: communication, runbook, validation.",
  });
  await rm(root, { recursive: true, force: true });
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.110.0",
    status: "fail",
    message: "Workspace repositories require a root AGENTS.md file.",
  });
});
