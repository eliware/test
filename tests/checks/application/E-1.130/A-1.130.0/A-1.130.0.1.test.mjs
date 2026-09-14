import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/application/E-1.130/A-1.130.0/A-1.130.0.1.mjs";

test("requires application operational concerns", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-"));
  await writeFile(join(root, "AGENTS.md"), "configuration shutdown workflow\n");
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "AGENTS.md"), "configuration\n");
  expect((await run({ root })).status).toBe("fail");
});

test("fails when application AGENTS guidance is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-agents-missing-"));
  expect((await run({ root })).status).toBe("fail");
});
