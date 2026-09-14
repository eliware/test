import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/private/E-1.150/E-1.150.0.mjs";

test("requires private distribution guidance", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-private-"));
  await writeFile(join(root, "AGENTS.md"), "private distribution restrictions");
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "AGENTS.md"), "private");
  expect((await run({ root })).status).toBe("fail");
});

test("fails when AGENTS.md is absent", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-private-missing-"));
  await expect(run({ root })).resolves.toEqual({
    ruleId: "E-1.150.0",
    status: "fail",
    message: "Private repositories must contain AGENTS.md.",
  });
});
