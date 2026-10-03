import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-0.1.160/E-0.1.160.7.mjs";

test("requires an exact version tag and digest as release identity", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const packageJson = { name: "@eliware/example" };
  await expect(run({ root, packageJson })).resolves.toEqual(
    expect.objectContaining({ status: "pass" }),
  );
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content.replace("ghcr.io/eliware/example:v1.2.3", "ghcr.io/eliware/example:latest"),
  );
  await expect(run({ root, packageJson })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("keeps the version-and-digest release identity check independent of README documentation", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const packageJson = { name: "@eliware/example" };
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content.replace(
      "tags: ghcr.io/eliware/example:v1.2.3",
      "tags: |\n            ghcr.io/eliware/example:v1.2.3\n            ghcr.io/eliware/example:latest",
    ),
  );
  await expect(run({ root, packageJson })).resolves.toEqual(
    expect.objectContaining({ status: "pass" }),
  );
});

test("rejects publication evidence for an image with the wrong package-derived identity", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content.replace("ghcr.io/eliware/example:v1.2.3", "ghcr.io/eliware/other:v1.2.3"),
  );

  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toMatchObject({
    status: "fail",
  });
});

test("reports workflow inspection failures", async () => {
  await expect(run({ root: "C:\\missing-ghcr-repository" })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("GHCR workflows could not be inspected"),
    }),
  );
});
