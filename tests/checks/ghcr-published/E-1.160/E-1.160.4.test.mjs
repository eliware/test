import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-1.160/E-1.160.4.mjs";

test("requires GHCR publication permissions", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(publicationPath, content.replace("packages: write", "packages: read"));
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
