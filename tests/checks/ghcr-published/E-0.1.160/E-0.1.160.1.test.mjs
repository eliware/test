import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-0.1.160/E-0.1.160.1.mjs";

test("requires the Eliware GHCR image name", async () => {
  const { root } = await createGhcrFixture();
  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toEqual(
    expect.objectContaining({ status: "pass" }),
  );
  await expect(run({ root, packageJson: { name: "@eliware/other" } })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
  await expect(run({ root, packageJson: {} })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("reports workflow inspection failures", async () => {
  await expect(
    run({ root: "C:\\missing-ghcr-repository", packageJson: { name: "@eliware/example" } }),
  ).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("GHCR workflows could not be inspected"),
    }),
  );
});

test("rejects a publication workflow that pushes a second image", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content.replace(
      "tags: ghcr.io/eliware/example:v1.2.3",
      "tags: |\n            ghcr.io/eliware/example:v1.2.3\n            ghcr.io/eliware/other:v1.2.3",
    ),
  );
  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("exactly one image"),
  });
});

test("rejects a push action without image tags", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(publicationPath, content.replace("tags: ghcr.io/eliware/example:v1.2.3", ""));
  await expect(run({ root, packageJson: { name: "@eliware/example" } })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("exactly one image"),
  });
});
