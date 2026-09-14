import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { checkAgents } from "../../../src/checks/general/agents-content.mjs";

test("matches required AGENTS guidance and reports missing content", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-agents-"));
  await writeFile(join(root, "AGENTS.md"), "repository purpose\n");
  expect((await checkAgents(root, "A-1.0.0", [["repository"], ["purpose"]])).status).toBe("pass");
  expect((await checkAgents(root, "A-1.0.0", [["repository"], ["missing"]])).status).toBe("fail");
  expect(await checkAgents(root, "A-1.0.0", [["repository"], ["missing"]])).toEqual({
    ruleId: "A-1.0.0",
    status: "fail",
    message: "AGENTS.md is missing required guidance: missing.",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when AGENTS.md is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-agents-missing-"));
  await expect(checkAgents(root, "A-1.0.0", [["repository"]])).resolves.toEqual({
    ruleId: "A-1.0.0",
    status: "fail",
    message: "AGENTS.md is required.",
  });
  await rm(root, { recursive: true, force: true });
});
