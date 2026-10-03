import { expect, test } from "@jest/globals";
import { validateWorkflowSiblingJobs } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sibling-jobs.mjs";

const validationIds = new Set(["validate"]);
const commands = (command) => [{ command }];

test("ignores validation and publication jobs", () => {
  const jobs = [{ id: "validate", commands: commands("curl example.test") }];
  expect(validateWorkflowSiblingJobs("ci.yaml", jobs, validationIds, new Set())).toBeNull();
  expect(
    validateWorkflowSiblingJobs(
      "publish.yaml",
      [{ id: "publish", commands: commands("npm publish") }],
      validationIds,
      new Set(["publish"]),
    ),
  ).toBeNull();
});

test("rejects unsafe commands and validation commands placed in sibling jobs", () => {
  expect(
    validateWorkflowSiblingJobs(
      "ci.yaml",
      [{ id: "deploy", commands: commands("curl example.test") }],
      validationIds,
      new Set(),
    ),
  ).toContain("ci.yaml contains non-validation command(s): curl example.test.");
  expect(
    validateWorkflowSiblingJobs(
      "ci.yaml",
      [{ id: "deploy", commands: commands("curl example.test") }],
      validationIds,
      new Set(),
    ),
  ).toContain("ci.yaml job deploy may only use approved actions");
  expect(
    validateWorkflowSiblingJobs(
      "ci.yaml",
      [{ id: "setup", commands: commands("npm test") }],
      validationIds,
      new Set(),
    ),
  ).toContain("ci.yaml job setup must keep npm ci and npm test in a validation job.");
});

test("applies pre-install safety policy to sibling reporting and setup steps", () => {
  expect(
    validateWorkflowSiblingJobs(
      "ci.yaml",
      [{ id: "setup", commands: commands("echo setup") }],
      validationIds,
      new Set(),
    ),
  ).toBeNull();
  expect(
    validateWorkflowSiblingJobs(
      "ci.yaml",
      [{ id: "setup", commands: commands("printf 'arbitrary=value\\n' > .env") }],
      validationIds,
      new Set(),
    ),
  ).toBe(
    "ci.yaml job setup may only use approved actions; other steps must be safe reporting commands.",
  );
});

test("uses original step positions when checking sibling-job actions", () => {
  const setup = { run: "echo setup" };
  const unreviewed = { uses: "someone/unreviewed-action@v1" };
  expect(
    validateWorkflowSiblingJobs(
      "ci.yaml",
      [
        {
          id: "setup",
          job: { steps: [setup, unreviewed] },
          commands: [{ command: setup.run, index: 0, step: setup }],
        },
      ],
      validationIds,
      new Set(),
    ),
  ).toContain("approved actions");
});

test("checks non-publication sibling jobs in publication workflows", () => {
  const jobs = [
    { id: "validate", commands: commands("npm test") },
    { id: "publish", commands: commands("npm publish --provenance") },
    { id: "extra", commands: commands("curl example.test") },
  ];
  expect(
    validateWorkflowSiblingJobs("publish.yaml", jobs, validationIds, new Set(["publish"])),
  ).toContain("publish.yaml contains non-validation command(s): curl example.test.");
  jobs[2].commands = commands("echo reporting");
  expect(
    validateWorkflowSiblingJobs("publish.yaml", jobs, validationIds, new Set(["publish"])),
  ).toBeNull();
});

test("rejects conditional validation commands in sibling jobs regardless of their conditions", () => {
  const testStep = { run: "npm test", if: "always()", "continue-on-error": true };
  const job = { if: "always()", steps: [testStep] };
  expect(
    validateWorkflowSiblingJobs(
      "ci.yaml",
      [
        {
          id: "supplemental",
          job,
          commands: [{ command: testStep.run, step: testStep, index: 0 }],
        },
      ],
      validationIds,
      new Set(),
    ),
  ).toContain("must keep npm ci and npm test in a validation job");
});

test("ignores GHCR publisher commands only when the profile is enabled", () => {
  const job = { steps: [{ uses: "docker/build-push-action@v6", with: { push: true } }] };
  const publisher = [
    {
      id: "publish",
      job,
      commands: commands("gh attestation verify oci://ghcr.io/eliware/app@sha256:abc"),
    },
  ];
  expect(
    validateWorkflowSiblingJobs("publish.yaml", publisher, validationIds, new Set()),
  ).toContain("non-validation command");
  expect(
    validateWorkflowSiblingJobs("publish.yaml", publisher, validationIds, new Set(["publish"])),
  ).toBeNull();
});
