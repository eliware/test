import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/documentation/E-1.100/A-1.100.0.mjs";

test("requires documentation guidance in AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-agents-"));
  await writeFile(join(root, "AGENTS.md"), "documentation scope authority index link validation");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.0",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("fails when documentation AGENTS guidance is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-agents-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.0",
    status: "fail",
    message: "Documentation repositories require a root AGENTS.md file.",
  });
  await rm(root, { recursive: true, force: true });
});

test("reports missing documentation topics", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-doc-agents-incomplete-"));
  await writeFile(join(root, "AGENTS.md"), "documentation scope");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "A-1.100.0",
    status: "fail",
    message: "AGENTS.md is missing documentation topics: authority, index, link, validation.",
  });
  await rm(root, { recursive: true, force: true });
});
