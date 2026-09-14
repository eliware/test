import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/workspace/E-1.110/A-1.110.1.mjs";

test("requires workspace README topics", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workspace-readme-"));
  await writeFile(
    join(root, "README.md"),
    "purpose role boundary authority runbook communication validation security support recovery",
  );
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.110.1",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports incomplete README topics and missing files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-workspace-readme-"));
  await writeFile(join(root, "README.md"), "purpose role boundary");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.110.1",
    status: "fail",
    message:
      "Workspace README.md is missing: authority, runbook, communication, validation, security, support, recovery.",
  });
  await rm(root, { recursive: true, force: true });
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.110.1",
    status: "fail",
    message: "Workspace repositories require a root README.md file.",
  });
});
