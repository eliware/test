import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  createGhcrWorkflow,
} from "../../../../test-fixtures/ghcr-workflow.mjs";
import { validateGhcrAttestationChain } from "../../../../src/checks/ghcr-published/E-0.1.11.1.2/validate-ghcr-attestation-chain.mjs";
import { ghcrPackage } from "../../../../test-fixtures/ghcr-workflow.mjs";

test("validates each publication digest chain", async () => {
  await expect(validateGhcrAttestationChain(createGhcrInventory())).resolves.toEqual([]);
});

test("requires GH_TOKEN on the verification step or publish job", async () => {
  const missingToken = createGhcrWorkflow();
  delete missingToken.jobs.publish.steps[6].env;
  await expect(
    validateGhcrAttestationChain(createGhcrInventory({ workflow: missingToken })),
  ).resolves.toContain(
    "GH attestation verification must set GH_TOKEN to ${{ github.token }} in its step or publish job.",
  );

  const jobToken = createGhcrWorkflow();
  delete jobToken.jobs.publish.steps[6].env;
  jobToken.jobs.publish.env.GH_TOKEN = "${{ github.token }}";
  await expect(
    validateGhcrAttestationChain(createGhcrInventory({ workflow: jobToken })),
  ).resolves.toEqual([]);
});

test("rejects commands that mention a check without running it", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps[4].run = `echo "docker buildx imagetools inspect ghcr.io/eliware/example:v${ghcrPackage.version}"`;

  await expect(validateGhcrAttestationChain(createGhcrInventory({ workflow }))).resolves.toContain(
    "GHCR push verification, inspection, attestation, and digest summary steps must run in order and unconditionally.",
  );
});

test("reports missing workflow data and missing push steps", async () => {
  await expect(validateGhcrAttestationChain()).resolves.toContain(
    "publish.yaml could not be inspected.",
  );
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps.splice(1);
  await expect(validateGhcrAttestationChain(createGhcrInventory({ workflow }))).resolves.toContain(
    "GHCR publisher must contain an image push before attestation.",
  );
});

test("reports missing publish steps", async () => {
  const workflow = createGhcrWorkflow();
  delete workflow.jobs.publish.steps;
  await expect(validateGhcrAttestationChain(createGhcrInventory({ workflow }))).resolves.toContain(
    "GHCR publisher must contain an image push before attestation.",
  );
});

test("requires the dynamic image name in the publisher environment", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.env.IMAGE_NAME = "ghcr.io/eliware/static-image";
  await expect(validateGhcrAttestationChain(createGhcrInventory({ workflow }))).resolves.toContain(
    "GHCR publisher must derive IMAGE_NAME from github.repository.",
  );
});
