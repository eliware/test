import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { expect, test } from "@jest/globals";
import { run } from "../../../../src/checks/npm-published/E-1.140/E-1.140.0.mjs";

test("requires publication guidance in AGENTS.md", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-npm-"));
  await writeFile(join(root, "AGENTS.md"), "npm publication requirements\n");
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.140.0",
    status: "pass",
    message: "",
  });
  await rm(root, { recursive: true, force: true });
});

test("rejects missing or irrelevant publication guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-npm-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.140.0",
    status: "fail",
    message: "AGENTS.md must document npm publication requirements.",
  });
  await writeFile(join(root, "AGENTS.md"), "general repository guidance\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await rm(root, { recursive: true, force: true });
});
