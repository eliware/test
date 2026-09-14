import { expect, test } from "@jest/globals";
import { mkdir, mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../../src/checks/general/E-1/E-1.24/E-1.24.4.mjs";

test("rejects no publication or deployment commands in validation workflows", async () => {
  await expect(run({ root: process.cwd() })).resolves.toEqual({
    ruleId: "E-1.24.4",
    status: "pass",
    message: "",
  });
});

test("inspects run commands but ignores URLs and comments outside commands", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "env:\n  IMAGE: ghcr.io/example/app\nrun-name: npm publish\njobs:\n  validate:\n    steps:\n      - run: npm ci\n      - run: npm test\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "pass" });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "jobs:\n  publish:\n    steps:\n      - run: npm publish\n",
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
  await rm(root, { recursive: true, force: true });
});

test("requires the validation command sequence in non-publication workflows", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-sequence-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "jobs:\n  validate:\n    steps:\n      - run: npm test\n",
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("npm ci") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("rejects unsupported commands and reversed validation order", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-sequence-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "jobs:\n  validate:\n    steps:\n      - run: npm ci\n      - run: curl https://example.test\n",
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("non-validation") }),
  );
  await writeFile(
    join(root, ".github", "workflows", "ci.yml"),
    "jobs:\n  validate:\n    steps:\n      - run: npm test\n      - run: npm ci\n",
  );
  await expect(run({ root })).resolves.toEqual(
    expect.objectContaining({ status: "fail", message: expect.stringContaining("followed by") }),
  );
  await rm(root, { recursive: true, force: true });
});

test("does not require validation order in publication workflows", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-workflow-release-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "release.yml"), "jobs:\n  release:\n    steps:\n      - run: npm publish\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.24.4", status: "fail", message: "release.yml contains a publication, deployment, or synchronization command." });
  await writeFile(join(root, ".github", "workflows", "release.yml"), "jobs:\n  release:\n    steps:\n      - run: echo release\n");
  await expect(run({ root })).resolves.toEqual({ ruleId: "E-1.24.4", status: "pass", message: "" });
  await rm(root, { recursive: true, force: true });
});
