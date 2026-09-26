import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-0.1.160/E-0.1.160.8.mjs";

test("accepts a publication workflow with complete image verification composition", async () => {
  const { root } = await createGhcrFixture();
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
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

test("rejects image pushes without a step id for the digest", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(publicationPath, content.replace("      - id: push\n        uses:", "      - uses:"));
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
});

test("does not let a verification chain span distinct image pushes", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  const secondPush = `      - id: second_push
        uses: docker/build-push-action@v6
        with:
          context: .
          file: ./Dockerfile
          push: true
          tags: ghcr.io/eliware/other:v1.2.3
`;
  await writeFile(
    publicationPath,
    content.replace(
      "      - uses: actions/attest@v4",
      `${secondPush}      - uses: actions/attest@v4`,
    ),
  );
  await expect(run({ root })).resolves.toMatchObject({ status: "fail" });
});
