import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-0.1.160/E-0.1.160.2.mjs";

test("requires an exact semantic-version tag gate", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const packageJson = { version: "1.2.3" };
  await expect(run({ root, packageJson })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  const tagContext = { root, packageJson, env: { GITHUB_REF_TYPE: "tag", GITHUB_REF_NAME: "v1.2.3" } };
  await expect(run(tagContext)).resolves.toMatchObject({ status: "pass" });
  await expect(run({ ...tagContext, env: { ...tagContext.env, GITHUB_REF_NAME: "v1.2.4" } })).resolves.toMatchObject({ status: "fail" });
  const { writeFile } = await import("node:fs/promises");
  await writeFile(
    publicationPath,
    "name: publish\non:\n  push:\n    branches: [main]\nrun: docker push ghcr.io/eliware/example:latest\n",
  );
  await expect(run({ root, packageJson })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
});

test("rejects text-only version references without package verification or the protected approval environment", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content
      .replace('environment: ghcr-publish\n', "")
      .replace(/      - run: test .*version --raw.*\n/u, "      - run: echo semver github.ref_name\n"),
  );
  await expect(run({ root, packageJson: { version: "1.2.3" } })).resolves.toMatchObject({ status: "fail" });
  await expect(run({ root, packageJson: {} })).resolves.toMatchObject({ status: "fail" });
});

test("reports workflow inspection failures", async () => {
  await expect(run({ root: "C:\\missing-ghcr-repository" })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("GHCR workflows could not be inspected"),
    }),
  );
});
