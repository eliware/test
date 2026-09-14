import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/discord/E-1.70/A-1.70.2.mjs";

test("requires Discord README topics", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discord-readme-"));
  await writeFile(
    join(root, "README.md"),
    "purpose requirements setup configuration commands events intents permissions validation operations security support license",
  );
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.70.2", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});

test("fails when the Discord README is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discord-readme-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.70.2",
    status: "fail",
    message: "Discord repositories require a root README.md file.",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when Discord README topics are incomplete", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-discord-readme-incomplete-"));
  await writeFile(join(root, "README.md"), "purpose");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.70.2",
    status: "fail",
    message: expect.stringContaining("requirements"),
  });
  await rm(root, { recursive: true, force: true });
});
