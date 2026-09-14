import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/npm-published/E-1.140/A-1.140.4.mjs";

test("requires least-privilege publication permissions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    `permissions:
  contents: read
  id-token: write
jobs:
  publish:
    steps:
      - run: npm view @eliware/example version
      - run: npm publish
`,
  );
  expect((await run({ root, packageJson: { name: "@eliware/example" } })).status).toBe("pass");
  await writeFile(join(root, ".github", "workflows", "publish.yml"), "npm publish\n");
  expect((await run({ root, packageJson: { name: "@eliware/example" } })).status).toBe("fail");
});

test("rejects unsafe publication permissions, credentials, and unverified versions", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-permissions-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    `permissions:
  contents: write
  id-token: write
  packages: write
jobs:
  publish:
    steps:
      - run: npm publish
`,
  );
  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    `permissions:
  contents: read
  id-token: write
jobs:
  publish:
    steps:
      - run: npm info other-package
      - run: npm publish
      - run: echo NPM_TOKEN
`,
  );
  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("passes when workflows are unavailable or contain no npm publication", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-publish-permissions-missing-"));
  await expect(run({ root: missing })).resolves.toEqual({ ruleId: "A-1.140.4", status: "pass", message: "" });
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-permissions-ci-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "name: ci\n");
  await expect(run({ root, packageJson: {} })).resolves.toEqual({ ruleId: "A-1.140.4", status: "pass", message: "" });
});
