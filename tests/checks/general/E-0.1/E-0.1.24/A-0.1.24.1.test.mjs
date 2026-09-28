import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.24/A-0.1.24.1.mjs";

test("rejects CodeScope in workflow files", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "run: codescope");
  expect((await run({ root })).status).toBe("fail");
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "run: npm test\nenv: null");
  expect((await run({ root })).status).toBe("pass");
});

test("rejects CodeScope supplied through a workflow environment value", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-env-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    'steps:\n  - run: "$TOOL"\n    env:\n      TOOL: codescope all\n',
  );
  expect((await run({ root })).status).toBe("fail");
});

test("reports workflow inspection failures", async () => {
  await expect(run({ root: "C:\\missing-repository" })).resolves.toEqual({
    ruleId: "A-0.1.24.1",
    status: "fail",
    message: "GitHub workflow files could not be inspected for CodeScope usage.",
  });
});
