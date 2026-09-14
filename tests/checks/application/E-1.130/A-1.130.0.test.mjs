import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/application/E-1.130/A-1.130.0.mjs";

test("requires application guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-"));
  await writeFile(join(root, "AGENTS.md"), "Application requirements\n");
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "AGENTS.md"), "general requirements\n");
  expect((await run({ root })).status).toBe("fail");
});

test("fails when application guidance is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-missing-"));
  expect((await run({ root })).status).toBe("fail");
});
