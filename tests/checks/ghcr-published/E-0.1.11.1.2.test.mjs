import { expect, test } from "@jest/globals";
import {
  createGhcrInventory,
  createGhcrWorkflow,
  ghcrPackage,
} from "../../../test-fixtures/ghcr-workflow.mjs";
import { ruleId, run } from "../../../src/checks/ghcr-published/E-0.1.11.1.2.mjs";

const validate = (workflow) =>
  run({ repositoryInventory: createGhcrInventory({ workflow }), packageJson: ghcrPackage });

test("accepts a matching digest attestation and verification chain", async () => {
  await expect(validate(createGhcrWorkflow())).resolves.toEqual({
    ruleId,
    status: "pass",
    message: "",
  });
});

test("rejects missing workflow inventory", async () => {
  await expect(run()).resolves.toMatchObject({ status: "fail" });
});

test("requires valid, unique push IDs and one matching attestation", async () => {
  const missingId = createGhcrWorkflow();
  delete missingId.jobs.publish.steps[1].id;
  await expect(validate(missingId)).resolves.toMatchObject({
    message: expect.stringContaining("valid step ID"),
  });
  const duplicateId = createGhcrWorkflow();
  duplicateId.jobs.publish.steps.splice(2, 0, structuredClone(duplicateId.jobs.publish.steps[1]));
  await expect(validate(duplicateId)).resolves.toMatchObject({
    message: expect.stringContaining("IDs must be unique"),
  });
  const missingAttestation = createGhcrWorkflow();
  missingAttestation.jobs.publish.steps.splice(2, 1);
  await expect(validate(missingAttestation)).resolves.toMatchObject({
    message: expect.stringContaining("one matching attestation"),
  });
});

test.each([
  [(flow) => (flow.jobs.publish.steps[2].uses = "actions/attest@v3"), "actions/attest v4"],
  [
    (flow) => (flow.jobs.publish.steps[2].with["subject-name"] = "ghcr.io/other/image"),
    "actions/attest v4",
  ],
  [(flow) => (flow.jobs.publish.steps[2].with["subject-digest"] = "wrong"), "actions/attest v4"],
  [(flow) => (flow.jobs.publish.steps[2].with["push-to-registry"] = false), "actions/attest v4"],
  [(flow) => (flow.jobs.publish.steps[2].if = "false"), "actions/attest v4"],
  [(flow) => (flow.jobs.publish.steps[3].run = "echo no digest"), "must run in order"],
  [(flow) => (flow.jobs.publish.steps[4].run = "echo no image inspect"), "must run in order"],
  [(flow) => (flow.jobs.publish.steps[5].run = "echo no attestation verify"), "must run in order"],
  [(flow) => (flow.jobs.publish.steps[6].run = "echo digest"), "must run in order"],
  [(flow) => (flow.jobs.publish.steps[6].if = "false"), "must run in order"],
  [(flow) => flow.jobs.publish.steps.push({ run: "echo after chain" }), "must end at the last"],
])("rejects an invalid digest attestation chain", async (change, message) => {
  const workflow = createGhcrWorkflow();
  change(workflow);
  await expect(validate(workflow)).resolves.toMatchObject({
    status: "fail",
    message: expect.stringContaining(message),
  });
});

test("rejects a workflow with no image push", async () => {
  const workflow = createGhcrWorkflow();
  workflow.jobs.publish.steps.splice(1);
  await expect(validate(workflow)).resolves.toMatchObject({
    message: expect.stringContaining("image push before attestation"),
  });
});
