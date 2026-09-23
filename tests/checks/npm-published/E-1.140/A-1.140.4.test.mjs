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
      - run: npm publish
`,
  );
  expect((await run({ root, packageJson: { name: "@eliware/example" } })).status).toBe("pass");
  expect((await run({ root, packageJson: {} })).status).toBe("fail");
  await writeFile(join(root, ".github", "workflows", "publish.yml"), "npm publish\n");
  expect((await run({ root, packageJson: { name: "@eliware/example" } })).status).toBe("fail");
});

test("accepts publication options with values", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-options-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `permissions:\n  contents: read\n  id-token: write\njobs:\n  publish:\n    steps:\n      - run: npm publish --access public --provenance\n`);
  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toEqual(
    expect.objectContaining({ status: "pass" }),
  );
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

test("fails when the required publication workflow is unavailable", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-publish-permissions-missing-"));
  await expect(run({ root: missing })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-permissions-ci-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "name: ci\n");
  await expect(run({ root, packageJson: {} })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects publication jobs with extra permission", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-unverified-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `permissions:\n  contents: read\n  id-token: write\n  attestations: write\njobs:\n  publish:\n    steps:\n      - run: npm publish\n`);
  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects an unparseable publication-looking companion workflow", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-permissions-mixed-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `permissions:\n  contents: read\n  id-token: write\njobs:\n  publish:\n    steps:\n      - run: npm publish\n`);
  await writeFile(join(root, ".github", "workflows", "legacy.yml"), "npm publish\n");
  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});
