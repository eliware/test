import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/cli/E-1.60/A-1.60.0.mjs";

test("requires CLI guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-"));
  await writeFile(join(root, "AGENTS.md"), "CLI requirements\n");
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "AGENTS.md"), "application requirements\n");
  expect((await run({ root })).status).toBe("fail");
});

test("fails when CLI AGENTS guidance is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-cli-missing-"));
  expect((await run({ root })).status).toBe("fail");
});
