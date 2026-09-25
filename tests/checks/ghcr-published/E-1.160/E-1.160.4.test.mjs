import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { mkdir, mkdtemp, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { run } from "../../../../src/checks/ghcr-published/E-1.160/E-1.160.4.mjs";

test("requires GHCR publication permissions", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(publicationPath, content.replace("packages: write", "packages: read"));
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("uses the job permission override as the effective permission set", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content.replace("  publish:\n    runs-on:", "  publish:\n    permissions:\n      contents: read\n      packages: read\n      id-token: write\n      attestations: write\n      artifact-metadata: write\n    runs-on:"),
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
});

test("checks every publication job and rejects unnecessary permissions", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(publicationPath, content.replace("  publish:\n", "  extra:\n    permissions:\n      contents: read\n      packages: write\n      id-token: write\n      attestations: write\n      artifact-metadata: write\n    steps:\n      - run: docker push ghcr.io/eliware/example:v1.2.3\n  publish:\n"));
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("reports workflow inspection failures", async () => {
  await expect(run({ root: "C:\\missing-ghcr-repository" })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("GHCR workflows could not be inspected"),
    }),
  );
});

test("fails when no GHCR publication job exists", async () => {
  const root = await mkdtemp(join(tmpdir(), "eliware-test-ghcr-empty-"));
  await mkdir(join(root, ".github", "workflows"), { recursive: true });
  await writeFile(join(root, ".github", "workflows", "ci.yml"), "jobs:\n  test:\n    steps:\n      - run: npm test\n");
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});
