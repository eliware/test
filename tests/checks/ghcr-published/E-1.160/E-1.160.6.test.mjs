import { expect, test } from "@jest/globals";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { isOwnedBuildStep, run } from "../../../../src/checks/ghcr-published/E-1.160/E-1.160.6.mjs";

test("requires Dockerfile build execution", async () => {
  const { root, publicationPath } = await createGhcrFixture();
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  const { readFile, writeFile } = await import("node:fs/promises");
  const runBuild = await createGhcrFixture();
  await writeFile(
    runBuild.publicationPath,
    "name: publish\non:\n  push:\n    tags: [\"v[0-9]+.[0-9]+.[0-9]+\"]\njobs:\n  publish:\n    steps:\n      - run: docker push ghcr.io/eliware/example:latest\n      - run: docker build .\n",
  );
  await expect(run({ root: runBuild.root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  await writeFile(runBuild.publicationPath, "name: publish\njobs:\n  publish:\n    steps:\n      - uses: docker/build-push-action@v6\n        with:\n          context: ./\n          file: ./Dockerfile\n");
  await expect(run({ root: runBuild.root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  await writeFile(runBuild.publicationPath, "name: publish\njobs:\n  publish:\n    steps:\n      - run: docker build -f Dockerfile .\n");
  await expect(run({ root: runBuild.root })).resolves.toEqual(expect.objectContaining({ status: "pass" }));
  await writeFile(runBuild.publicationPath, "name: publish\njobs:\n  publish:\n    steps:\n      - run: docker build other\n");
  await expect(run({ root: runBuild.root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content.replace("docker/build-push-action@v6", "docker/compile-action@v6"),
  );
  await expect(run({ root: runBuild.root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));
  await expect(run({ root })).resolves.toEqual(expect.objectContaining({ status: "fail" }));

});

test("reports Dockerfile inspection failures", async () => {
  await expect(run({ root: "C:\\missing-ghcr-repository" })).resolves.toEqual(
    expect.objectContaining({
      status: "fail",
      message: expect.stringContaining("GHCR build definition could not be inspected"),
    }),
  );
});

test("classifies owned build steps without textual false positives", () => {
  expect(isOwnedBuildStep({})).toBe(false);
  expect(isOwnedBuildStep({ uses: "docker/build-push-action@v6", with: { context: "other" } })).toBe(false);
  expect(isOwnedBuildStep({ uses: "docker/build-push-action@v6", with: { file: "other" } })).toBe(false);
  expect(isOwnedBuildStep({ run: "docker build -f other Dockerfile ." })).toBe(false);
  expect(isOwnedBuildStep({ run: "docker build -f Dockerfile ." })).toBe(true);
});
