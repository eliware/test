import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.24/E-1.24.3.mjs";

test("requires repository/ref concurrency cancellation", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "E-1.24.3",
    status: "pass",
    message: "",
  });
});

test("rejects missing or incorrectly typed concurrency fields", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "concurrency:\n  cancel-in-progress: false\njobs:\n  validate:\n    steps:\n      - run: npm ci\n      - run: npm test\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "jobs:\n  publish:\n    steps:\n      - run: npm publish\n");
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await rm(root, { recursive: true, force: true });
});

test("requires concurrency for validation jobs in mixed workflows", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-mixed-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "release.yml"), `jobs:
  validate:
    steps:
      - run: npm ci
      - run: npm test
  publish:
    steps:
      - run: npm publish
`);
  await expect(run({ root })).resolves.toMatchObject({ ruleId: "E-1.24.3", status: "fail" });
  await writeFile(join(root, ".github", "workflows", "release.yml"), `concurrency:
  group: "\${{ github.repository }}-\${{ github.ref }}"
  cancel-in-progress: true
jobs:
  validate:
    steps:
      - run: npm ci
      - run: npm test
  publish:
    steps:
      - run: npm publish
`);
  await expect(run({ root })).resolves.toMatchObject({ ruleId: "E-1.24.3", status: "pass" });
  await writeFile(join(root, ".github", "workflows", "release.yml"), `concurrency:
  group: "\${{ github.repository }}-\${{ github.ref }}"
  cancel-in-progress: true
jobs:
  build:
    steps:
      - run: npm ci
      - run: npm test
  publish:
    steps:
      - run: npm publish
`);
  await expect(run({ root })).resolves.toMatchObject({ ruleId: "E-1.24.3", status: "pass" });
  await rm(root, { recursive: true, force: true });
});
