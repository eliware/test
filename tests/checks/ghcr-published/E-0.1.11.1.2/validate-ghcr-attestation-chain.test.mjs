import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  createGhcrWorkflow,
  ghcrPackage,
} from "../../../../test-fixtures/ghcr-workflow.mjs";
import { validateGhcrAttestationChain } from "../../../../src/checks/ghcr-published/E-0.1.11.1.2/validate-ghcr-attestation-chain.mjs";

test("validates each publication digest chain", async () => {
  await expect(validateGhcrAttestationChain(createGhcrInventory(), ghcrPackage)).resolves.toEqual(
    [],
  );
});

test("reports missing workflow data and missing push steps", async () => {
  await expect(validateGhcrAttestationChain()).resolves.toContain(
    "publish.yaml could not be inspected.",
  );
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps.splice(1);
  await expect(
    validateGhcrAttestationChain(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toContain("GHCR publisher must contain an image push before attestation.");
});

test("reports missing publish steps and package image data", async () => {
  const workflow = createGhcrWorkflow();
  delete workflow.jobs.publish.steps;
  await expect(
    validateGhcrAttestationChain(createGhcrInventory({ workflow }), ghcrPackage),
  ).resolves.toContain("GHCR publisher must contain an image push before attestation.");
  await expect(validateGhcrAttestationChain(createGhcrInventory(), {})).resolves.toContain(
    "GHCR image push push must have a matching actions/attest v4 step.",
  );
});
