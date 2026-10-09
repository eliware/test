import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  createGhcrWorkflow,
  ghcrPackage,
} from "../../../../test-fixtures/ghcr-workflow.mjs";
import { validateGhcrPublishWorkflow } from "../../../../src/checks/ghcr-published/E-0.1.11.1.1/validate-ghcr-publish-workflow.mjs";

test("validates the GHCR workflow profile requirements", async () => {
  await expect(validateGhcrPublishWorkflow(createGhcrInventory(), ghcrPackage)).resolves.toEqual(
    [],
  );
});

test("reports a missing workflow file", async () => {
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ files: ["Dockerfile"] }), ghcrPackage),
  ).resolves.toContain(".github/workflows/publish.yaml is required.");
});

test("reports an image tag outside the package image", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[1].with.tags = "ghcr.io/other/image:v12.0.0";
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toContain(
    "GHCR image tags must use one package-derived name and the exact v-prefixed version.",
  );
});

test("rejects missing workflow sections and incomplete publisher data", async () => {
  const workflow = createGhcrWorkflow();
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow: {} }), ghcrPackage),
  ).resolves.toEqual(
    expect.arrayContaining([
      "GHCR publish job must use the ghcr-publish environment.",
      "GHCR publish job must run on Ubuntu.",
    ]),
  );
  delete workflow.jobs.publish.steps;
  await expect(validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), {})).resolves.toEqual(
    expect.arrayContaining([
      "GHCR image name must use the unscoped package name.",
      "GHCR publisher must use checkout v6 once.",
      "GHCR publisher must build and push an image.",
    ]),
  );
});

test("rejects missing image tag values", async () => {
  const workflow = createGhcrWorkflow();
  delete workflow.jobs.publish.steps[1].with.tags;
  await expect(
    validateGhcrPublishWorkflow(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toContain(
    "GHCR image tags must use one package-derived name and the exact v-prefixed version.",
  );
});
