import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.24/A-1.24.0.mjs";

test("requires npm ci before npm test", async () => {
  const root = process.cwd();
  await expect(run({ root })).resolves.toEqual({ ruleId: "A-1.24.0", status: "pass", message: "" });
});

test("does not treat comments or unrelated strings as validation steps", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "name: npm ci then npm test\nrun: echo no validation\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("requires validation commands in workflow job steps", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "name: Validation\njobs:\n  test:\n    steps:\n      - run: echo npm ci\n      - run: npm test\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});
