import { expect, test } from "@jest/globals";
import { readFile, unlink, writeFile } from "node:fs/promises";
import { join } from "node:path";
import { createGhcrFixture } from "../../../../test-fixtures/ghcr-workflow.mjs";
import { run } from "../../../../src/checks/ghcr-published/E-0.1.160/E-0.1.160.11.mjs";

const usage = [
  "# README",
  "## Usage",
  "Image: ghcr.io/eliware/example",
  "Pull command: docker pull ghcr.io/eliware/example:v1.2.3",
  "Supported tags: vMAJOR.MINOR.PATCH",
  "Deployment boundary: publication does not deploy; deploy by immutable version tag and recorded sha256 digest.",
].join("\n");

async function setup() {
  const fixture = await createGhcrFixture();
  await writeFile(join(fixture.root, "README.md"), usage);
  return fixture;
}

const context = (root) => ({
  root,
  packageJson: { name: "@eliware/example", version: "1.2.3" },
});

test("passes when Usage contains the canonical image, pull, tags, and deployment markers", async () => {
  const { root } = await setup();
  await expect(run(context(root))).resolves.toMatchObject({ status: "pass" });
});

test.each([
  ["Image:", "Image: ghcr.io/eliware/other"],
  ["Pull command:", "Pull command: docker pull ghcr.io/eliware/example:latest"],
  ["Supported tags:", "Supported tags: latest"],
  ["Deployment boundary:", "Deployment boundary: deploy automatically."],
])("reports an invalid %s marker", async (marker, replacement) => {
  const { root } = await setup();
  const readmePath = join(root, "README.md");
  await writeFile(readmePath, usage.replace(new RegExp(`^${marker}.*$`, "mu"), replacement));
  await expect(run(context(root))).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining(marker.slice(0, -1)),
  });
});

test("requires supported latest documentation only if its image is published", async () => {
  const { root, publicationPath } = await setup();
  const content = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    content.replace(
      "tags: ghcr.io/eliware/example:v1.2.3",
      "tags: |\n            ghcr.io/eliware/example:v1.2.3\n            ghcr.io/eliware/example:latest",
    ),
  );
  await expect(run(context(root))).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("mutable convenience alias"),
  });
  await writeFile(
    join(root, "README.md"),
    `${usage.replace("Supported tags: vMAJOR.MINOR.PATCH", "Supported tags: vMAJOR.MINOR.PATCH, latest")}\nlatest is a mutable convenience alias and is never the release or deployment identity.`,
  );
  await expect(run(context(root))).resolves.toMatchObject({ status: "pass" });
});

test("reports a missing Usage section", async () => {
  const { root } = await setup();
  await writeFile(join(root, "README.md"), "# README\n\nNo usage here.\n");
  await expect(run(context(root))).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("Image marker"),
  });
});

test("reports missing package identity values", async () => {
  const { root } = await setup();
  await expect(run({ root, packageJson: {} })).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("Image marker"),
  });
});

test("does not require the latest alias when the push step is disabled", async () => {
  const { root, publicationPath } = await setup();
  const workflow = await readFile(publicationPath, "utf8");
  await writeFile(
    publicationPath,
    workflow
      .replace("push: true", "push: false")
      .replace("tags: ghcr.io/eliware/example:v1.2.3", "tags: ghcr.io/eliware/example:latest"),
  );
  await expect(run(context(root))).resolves.toMatchObject({ status: "pass" });
});

test("reports README read failures", async () => {
  const { root } = await setup();
  await unlink(join(root, "README.md"));
  await expect(run(context(root))).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining("GHCR README could not be inspected"),
  });
});
