import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run as checkGhcrPublicationWorkflow } from "../../../../src/checks/ghcr-published/E-0.1.160/E-0.1.160.2.mjs";

const run = (context) => checkGhcrPublicationWorkflow({ env: {}, ...context });

test("validates the tag gate on ordinary runs and enforces tag-release identity", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const packageJson = { name: "@eliware/example", version: "1.2.3" };
  await expect(run({ root, packageJson })).resolves.toEqual(
    expect.objectContaining({ status: "pass" }),
  );
  const tagContext = {
    root,
    packageJson,
    env: { GITHUB_REF_TYPE: "tag", GITHUB_REF_NAME: "v1.2.3" },
  };
  await expect(run(tagContext)).resolves.toMatchObject({ status: "pass" });
  await expect(
    run({ ...tagContext, env: { ...tagContext.env, GITHUB_REF_NAME: "v1.2.4" } }),
  ).resolves.toMatchObject({ status: "fail" });
  const { writeFile } = await import("node:fs/promises");
  await writeFile(
    publicationPath,
    "name: publish\non:\n  push:\n    branches: [main]\nrun: docker push ghcr.io/eliware/example:latest\n",
  );
  await expect(run({ root, packageJson })).resolves.toEqual(
    expect.objectContaining({ status: "fail" }),
  );
});

test("uses the process environment when invocation context omits one", async () => {
  const { root } = await createGhcrFixture();
  const previousRefType = process.env.GITHUB_REF_TYPE;
  const previousRefName = process.env.GITHUB_REF_NAME;
  process.env.GITHUB_REF_TYPE = "branch";
  process.env.GITHUB_REF_NAME = "main";
  try {
    await expect(
      checkGhcrPublicationWorkflow({
        root,
        packageJson: { name: "@eliware/example", version: "1.2.3" },
      }),
    ).resolves.toMatchObject({ status: "pass" });
  } finally {
    if (previousRefType === undefined) delete process.env.GITHUB_REF_TYPE;
    else process.env.GITHUB_REF_TYPE = previousRefType;
    if (previousRefName === undefined) delete process.env.GITHUB_REF_NAME;
    else process.env.GITHUB_REF_NAME = previousRefName;
  }
});

test("requires the publisher job to depend on successful Ubuntu validation", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({
    status: "pass",
  });
  await writeFile(
    publicationPath,
    content.replace("    needs: validate\n", "    needs: [validate]\n"),
  );
  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({
    status: "pass",
  });
  await writeFile(publicationPath, content.replace("    needs: validate\n", ""));
  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({
    status: "fail",
  });
});

test("rejects text-only version references without package verification or the protected approval environment", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content
      .replace("environment: ghcr-publish\n", "")
      .replace(
        /      - run: test .*version --raw.*\n/u,
        "      - run: echo semver github.ref_name\n",
      ),
  );
  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({
    status: "fail",
  });
  await expect(run({ root, packageJson: {} })).resolves.toMatchObject({ status: "fail" });
});

test("requires one image push with only the package version tag", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  await writeFile(publicationPath, content.replace("example:v1.2.3", "example:v1.2.4"));
  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({
    status: "fail",
  });
  await writeFile(
    publicationPath,
    content.replace(
      "      - uses: actions/attest@v4",
      "      - uses: docker/build-push-action@v6\n        with:\n          push: true\n          tags: ghcr.io/eliware/other:v1.2.3\n      - uses: actions/attest@v4",
    ),
  );
  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({
    status: "fail",
  });
  await writeFile(
    publicationPath,
    content.replace("ghcr.io/eliware/example:v1.2.3", "ghcr.io/eliware/other:v1.2.3"),
  );
  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({
    status: "fail",
  });
});

test("rejects an image push that occurs before the package-version tag guard", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { readFile, writeFile } = await import("node:fs/promises");
  const content = await readFile(publicationPath, "utf8");
  const guardStep = content.match(
    /      - id: release-version-check\n        run: '[^\n]+'\n/u,
  )?.[0];
  expect(guardStep).toBeDefined();
  const reversed = content
    .replace(guardStep, "")
    .replace("      - uses: actions/attest@v4", `${guardStep}      - uses: actions/attest@v4`);
  await writeFile(publicationPath, reversed);
  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({ status: "fail" });
});

test("rejects an invalid publisher workflow alongside a valid publisher workflow", async () => {
  const { root } = await createGhcrFixture();
  const { writeFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  await writeFile(
    join(root, ".github", "workflows", "publish-unguarded.yml"),
    "name: unguarded publish\non:\n  push:\n    branches: [main]\njobs:\n  publish:\n    runs-on: ubuntu-latest\n    steps:\n      - run: docker push ghcr.io/eliware/example:latest\n",
  );

  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({
    status: "fail",
  });
});

test("rejects multiple GHCR publication workflows", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  const { copyFile } = await import("node:fs/promises");
  const { join } = await import("node:path");
  await copyFile(publicationPath, join(root, ".github", "workflows", "publish-copy.yaml"));

  await expect(
    run({ root, packageJson: { name: "@eliware/example", version: "1.2.3" } }),
  ).resolves.toMatchObject({ status: "fail" });
});

test("reports workflow inspection failures", async () => {
  await expect(run({ root: "C:\\missing-ghcr-repository" })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("GHCR workflows could not be inspected"),
    }),
  );
});
