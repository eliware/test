import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-1.160/E-1.160.3.mjs";

test("requires separate validation and publication workflows", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  const { readFile, writeFile } = await import("node:fs/promises");
  await writeFile(
    publicationPath,
    (await readFile(publicationPath, "utf8")) + "\nrun: npm ci\nrun: npm test\n",
  );
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("fails when either validation or publication workflows are absent", async () => {
  const { root } = await createGhcrFixture();
  const { rm } = await import("node:fs/promises");
  await rm(`${root}/.github/workflows/validation.yml`);
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));

  const second = await createGhcrFixture();
  await rm(`${second.root}/.github/workflows/publish.yml`);
  await expect(run({ root: second.root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("reports workflow inspection failures", async () => {
  await expect(run({ root: "C:\\missing-ghcr-repository" })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("GHCR workflows could not be inspected"),
    }),
  );
});
