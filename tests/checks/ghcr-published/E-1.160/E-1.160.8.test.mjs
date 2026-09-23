import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-1.160/E-1.160.8.mjs";

test("requires version-tag digest equality, image readability, and attestation verification", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content.replace('= "${{ steps.push.outputs.digest }}"', '= "sha256:wrong"'),
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(publicationPath, content.replace("gh attestation verify", "gh attestation list"));
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await writeFile(publicationPath, content.replace("docker buildx imagetools inspect ghcr.io/eliware/example@", "docker buildx imagetools list ghcr.io/eliware/example@"));
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

test("fails when publication has no image push step", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(publicationPath, content.replace("push: true", "push: false"));
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
});
