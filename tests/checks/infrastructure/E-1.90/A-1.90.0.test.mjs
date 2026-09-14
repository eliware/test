import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/infrastructure/E-1.90/A-1.90.0.mjs";

test("requires infrastructure guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-infra-"));
  await writeFile(join(root, "AGENTS.md"), "infrastructure managed ownership validation secret");
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.90.0", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("reports missing topics and missing guidance files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-infra-"));
  await writeFile(join(root, "AGENTS.md"), "infrastructure managed ownership validation");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.90.0",
    status: "fail",
    message: "AGENTS.md is missing infrastructure topics: secret.",
  });
  await rm(root, { recursive: true, force: true });
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.90.0",
    status: "fail",
    message: "Infrastructure repositories require a root AGENTS.md file.",
  });
});
