import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/npm-published/E-1.140/A-1.140.2.mjs";

test("validates publication workflow gates when present", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    `on:
  push:
    tags: ["v*.*.*"]
jobs:
  publish:
    runs-on: ubuntu-latest
    steps:
      - run: npm pkg get version
      - run: test "$(npm pkg get version --raw)" = "\${GITHUB_REF_NAME#v}"
      - run: npm publish
`,
  );
  expect((await run({ root, packageJson: { version: "1.2.3" } })).status).toBe("pass");
  await writeFile(join(root, ".github", "workflows", "publish.yml"), "npm publish\n");
  expect((await run({ root, packageJson: { version: "1.2.3" } })).status).toBe("fail");
});

test("fails when the required publication workflow is unavailable", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-publish-missing-"));
  await expect(run({ root: missing, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-nonpublication-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "name: ci\n");
  await expect(run({ root, packageJson: {} })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects publication workflows without all release gates", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-invalid-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "publish.yml"),
    "jobs:\n  publish:\n    steps:\n      - run: npm publish\n",
  );
  await expect(run({ root, packageJson: {} })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects publication workflows with inaccurate version, trigger, or runner", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-policy-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  const file = join(root, ".github", "workflows", "publish.yml");
  const base = (tag, version, runner) => `on:\n  push:\n    tags: ["${tag}"]\njobs:\n  publish:\n    runs-on: ${runner}\n    steps:\n      - run: test "$(npm pkg get version --raw)" = "\${GITHUB_REF_NAME#v}"\n      - run: npm publish\n`;
  await writeFile(file, base("main", "v1.2.3", "ubuntu-latest"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(file, base("v*.*.*", "v9.9.9", "ubuntu-latest"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  await writeFile(file, base("v*.*.*", "v1.2.3", "windows-latest"));
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects an unparseable publication-looking workflow alongside a valid publisher", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-mixed-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "publish.yml"), `on:\n  push:\n    tags: ["v*.*.*"]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: npm pkg get version\n      - run: echo v1.2.3 github.ref_name\n      - run: npm publish\n`);
  await writeFile(join(root, ".github", "workflows", "legacy.yml"), "npm publish\n");
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(join(root, ".github", "workflows", "legacy.yml"), "name: legacy\n");
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});
