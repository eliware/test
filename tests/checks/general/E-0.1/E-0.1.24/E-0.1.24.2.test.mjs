import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-0.1/E-0.1.24/E-0.1.24.2.mjs";

test("accepts the repository workflow action versions", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "E-0.1.24.2",
    status: "pass",
    message: "",
  });
});

test("rejects an unapproved required action version from parsed uses values", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "jobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("reports every unapproved action version in one workflow", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-actions-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "jobs:\n  test:\n    steps:\n      - uses: actions/checkout@v4\n      - uses: actions/setup-node@v6\n",
  );
  const result = await run({ root });
  expect(result.message).toContain("actions/checkout@v4");
  expect(result.message).toContain("actions/setup-node@v6");
  await rm(root, { recursive: true, force: true });
});

test("requires setup-node v7 in CI and npm publication workflows", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-versions-"));
  const directory = join(root, ".github", "workflows");
  await mkdir(directory, { recursive: true });
  await writeFile(
    join(directory, "ci.yml"),
    "jobs:\n  test:\n    steps:\n      - uses: actions/setup-node@v7\n      - uses: actions/cache@v4\n",
  );
  await writeFile(
    join(directory, "publish.yml"),
    "jobs:\n  publish:\n    steps:\n      - uses: actions/checkout@v6\n      - uses: actions/setup-node@v7\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });

  await writeFile(
    join(directory, "ci.yml"),
    "jobs:\n  test:\n    steps:\n      - uses: actions/setup-node@v6\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });

  await writeFile(
    join(directory, "ci.yml"),
    "jobs:\n  test:\n    steps:\n      - uses: actions/setup-node@v7\n",
  );
  await writeFile(
    join(directory, "publish.yml"),
    "jobs:\n  publish:\n    steps:\n      - uses: actions/setup-node@v6\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("returns a failed check result when workflow discovery or parsing fails", async () => {
  const missingRoot = await mkdtemp(join(tmpdir(), "eliware-test-missing-workflows-"));
  await expect(run({ root: missingRoot })).resolves.toMatchObject({
    ruleId: "E-0.1.24.2",
    status: "fail",
    message: expect.stringContaining("could not be read or parsed"),
  });
  await rm(missingRoot, { recursive: true, force: true });

  const malformedRoot = await mkdtemp(join(tmpdir(), "eliware-test-malformed-workflow-"));
  const workflowDirectory = join(malformedRoot, ".github", "workflows");
  await mkdir(workflowDirectory, { recursive: true });
  await writeFile(join(workflowDirectory, "ci.yml"), "jobs: [\n");
  await expect(run({ root: malformedRoot })).resolves.toMatchObject({
    ruleId: "E-0.1.24.2",
    status: "fail",
    message: expect.stringContaining("could not be read or parsed"),
  });
  await rm(malformedRoot, { recursive: true, force: true });
});
