import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.24/E-1.24.2.mjs";

test("accepts the repository workflow action versions", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "E-1.24.2",
    status: "pass",
    message: "",
  });
});

test("rejects a non-v6 required action from parsed uses values", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "jobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});
