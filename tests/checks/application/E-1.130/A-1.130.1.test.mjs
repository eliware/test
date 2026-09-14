import { expect, test } from "@jest/globals";
import { mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/application/E-1.130/A-1.130.1.mjs";

test("requires workflows in application README", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-"));
  await writeFile(join(root, "README.md"), "Externally observable workflow\n");
  expect((await run({ root })).status).toBe("pass");
  await writeFile(join(root, "README.md"), "Application usage\n");
  expect((await run({ root })).status).toBe("fail");
});

test("fails when application README is missing", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-app-readme-missing-"));
  expect((await run({ root })).status).toBe("fail");
});
