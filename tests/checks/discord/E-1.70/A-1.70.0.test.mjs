import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/discord/E-1.70/A-1.70.0.mjs";

test("requires Discord guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discord-"));
  await writeFile(join(root, "AGENTS.md"), "discord configuration validation");
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.70.0", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("fails when Discord AGENTS guidance is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discord-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.70.0",
    status: "fail",
    message: "Discord repositories require a root AGENTS.md file.",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when Discord configuration or validation guidance is incomplete", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discord-incomplete-"));
  await writeFile(join(root, "AGENTS.md"), "discord configuration");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.70.0",
    status: "fail",
    message: "Discord repositories must document Discord configuration and validation in AGENTS.md.",
  });
  await rm(root, { recursive: true, force: true });
});
