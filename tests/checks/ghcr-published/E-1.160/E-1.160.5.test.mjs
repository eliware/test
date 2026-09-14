import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-1.160/E-1.160.5.mjs";

test("requires signed image attestation permissions", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(publicationPath, content.replace("attestations: write", "attestations: read"));
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));

  const noJob = await createGhcrFixture();
  await writeFile(
    noJob.publicationPath,
    "name: publish\non:\n  push:\n    tags: [\\\"v*.*.*\\\"]\n",
  );
  await expect(run({ root: noJob.root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("fails when publication or attestation steps are absent", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { writeFile } = await import("node:fs/promises");
  await writeFile(
    publicationPath,
    "name: publish\non:\n  push:\n    tags: [\\\"v*.*.*\\\"]\njobs:\n  publish:\n    steps:\n      - run: docker push ghcr.io/eliware/example:latest\n",
  );
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
