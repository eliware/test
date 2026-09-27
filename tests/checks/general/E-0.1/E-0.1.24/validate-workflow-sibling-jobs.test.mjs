import { expect, test } from "@jest/globals";
import { validateWorkflowSiblingJobs } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sibling-jobs.mjs";

const validationIds = new Set(["validate"]);
const commands = (command) => [{ command }];

test("ignores validation and publication jobs", () => {
  const jobs = [{ id: "validate", commands: commands("curl example.test") }];
  expect(validateWorkflowSiblingJobs("ci.yml", jobs, validationIds, false)).toBeNull();
  expect(validateWorkflowSiblingJobs("publish.yml", [{ id: "publish", commands: commands("npm publish") }], validationIds, true)).toBeNull();
});

test("rejects unsafe commands and validation commands placed in sibling jobs", () => {
  expect(validateWorkflowSiblingJobs("ci.yml", [{ id: "deploy", commands: commands("curl example.test") }], validationIds, false)).toBe(
    "ci.yml contains non-validation command(s): curl example.test.",
  );
  expect(validateWorkflowSiblingJobs("ci.yml", [{ id: "setup", commands: commands("npm test") }], validationIds, false)).toBe(
    "ci.yml job setup must keep npm ci and npm test in a validation job.",
  );
});

test("applies pre-install safety policy to sibling reporting and setup steps", () => {
  expect(validateWorkflowSiblingJobs("ci.yml", [{ id: "setup", commands: commands("echo setup") }], validationIds, false)).toBeNull();
  expect(validateWorkflowSiblingJobs("ci.yml", [{ id: "setup", commands: commands("printf 'arbitrary=value\\n' > .env") }], validationIds, false)).toBe(
    "ci.yml job setup may only use approved actions; other steps must be safe reporting commands.",
  );
});

test("uses original step positions when checking sibling-job actions", () => {
  const setup = { run: "echo setup" };
  const unreviewed = { uses: "someone/unreviewed-action@v1" };
  expect(validateWorkflowSiblingJobs("ci.yml", [{
    id: "setup",
    job: { steps: [setup, unreviewed] },
    commands: [{ command: setup.run, index: 0, step: setup }],
  }], validationIds, false)).toContain("approved actions");
});

test("checks non-publication sibling jobs in publication workflows", () => {
  const jobs = [
    { id: "validate", commands: commands("npm test") },
    { id: "publish", commands: commands("npm publish --provenance") },
    { id: "extra", commands: commands("curl example.test") },
  ];
  expect(validateWorkflowSiblingJobs("publish.yml", jobs, validationIds, true)).toBe(
    "publish.yml contains non-validation command(s): curl example.test.",
  );
  jobs[2].commands = commands("echo reporting");
  expect(validateWorkflowSiblingJobs("publish.yml", jobs, validationIds, true)).toBeNull();
});
