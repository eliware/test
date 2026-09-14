import { expect, test } from "@jest/globals";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/cli/E-1.60/A-1.60.0/A-1.60.0.1.mjs";

test("requires CLI behavior in AGENTS.md", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "A-1.60.0.1",
    status: "pass",
    message: "",
  });
});

test("fails when CLI behavior guidance is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-behavior-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.60.0.1",
    status: "fail",
    message: "AGENTS.md must document CLI entrypoints and supported behavior.",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when a CLI behavior term is undocumented", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-behavior-incomplete-"));
  await writeFile(join(root, "AGENTS.md"), "CLI\n");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.60.0.1",
    status: "fail",
    message: "AGENTS.md must document CLI entrypoint behavior.",
  });
  await rm(root, { recursive: true, force: true });
});
