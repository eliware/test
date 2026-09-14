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
      - run: echo v1.2.3 github.ref_name
      - run: npm publish
`,
  );
  expect((await run({ root, packageJson: { version: "1.2.3" } })).status).toBe("pass");
  await writeFile(join(root, ".github", "workflows", "publish.yml"), "npm publish\n");
  expect((await run({ root, packageJson: { version: "1.2.3" } })).status).toBe("fail");
});

test("passes when workflows are unavailable or contain no publication", async () => {
  const missing = await mkdtemp(join(tmpdir(), "eliware-test-publish-missing-"));
  await expect(run({ root: missing, packageJson: { version: "1.2.3" } })).resolves.toEqual({
    ruleId: "A-1.140.2",
    status: "pass",
    message: "",
  });
  const root = await mkdtemp(join(tmpdir(), "eliware-test-publish-nonpublication-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "name: ci\n");
  await expect(run({ root, packageJson: {} })).resolves.toEqual({
    ruleId: "A-1.140.2",
    status: "pass",
    message: "",
  });
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
