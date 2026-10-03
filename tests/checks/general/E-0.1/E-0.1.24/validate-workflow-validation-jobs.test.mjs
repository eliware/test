import { expect, test } from "@jest/globals";
import { validateWorkflowValidationJobs } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-validation-jobs.mjs";
import {
  npmWorkflowSteps,
  workflowCommands,
} from "../../../../../test-fixtures/npm-workflow-steps.mjs";

function validationJob(commands, jobProperties = {}) {
  const steps = npmWorkflowSteps(commands);
  return {
    job: { "runs-on": "ubuntu-latest", ...jobProperties, steps },
    commands: workflowCommands(steps),
  };
}

test("accepts the required Ubuntu validation sequence and arbitrary post-test commands", () => {
  expect(
    validateWorkflowValidationJobs("ci.yaml", [
      validationJob(["npm ci", "npm test", "node scripts/repository-check.mjs"]),
    ]),
  ).toBeNull();
});

test("rejects setup commands before npm ci", () => {
  expect(
    validateWorkflowValidationJobs("ci.yaml", [
      validationJob(["curl example.test", "npm ci", "npm test"]),
    ]),
  ).toBe("ci.yaml may only use approved actions; other steps must be safe reporting commands.");
});

test("rejects missing and non-adjacent npm ci and npm test commands", () => {
  expect(validateWorkflowValidationJobs("publish.yaml", [validationJob([])])).toContain(
    "must run npm ci followed immediately by npm test",
  );
  const steps = npmWorkflowSteps(["npm ci"]);
  steps.splice(4, 0, { uses: "actions/setup-node@v7" });
  steps.push({ run: "npm test" });
  const job = { job: { "runs-on": "ubuntu-latest", steps }, commands: workflowCommands(steps) };
  expect(validateWorkflowValidationJobs("publish.yaml", [job])).toContain(
    "must run npm ci immediately followed by npm test with no intervening steps",
  );
});

test("rejects validation jobs missing workflow metadata", () => {
  const steps = npmWorkflowSteps(["npm ci", "npm test"]);
  expect(
    validateWorkflowValidationJobs("ci.yaml", [
      { job: { steps }, commands: workflowCommands(steps) },
    ]),
  ).toBe("ci.yaml validation jobs must run on an Ubuntu runner.");
  expect(
    validateWorkflowValidationJobs("ci.yaml", [
      { job: { "runs-on": "ubuntu-latest" }, commands: [] },
    ]),
  ).toContain("must run npm ci followed immediately by npm test");
});

test("rejects every duplicate npm ci or npm test occurrence", () => {
  for (const commands of [
    ["npm ci", "npm test", "npm ci"],
    ["npm ci", "npm test", "npm test"],
  ]) {
    expect(validateWorkflowValidationJobs("ci.yaml", [validationJob(commands)])).toContain(
      "must run npm ci followed immediately by npm test",
    );
  }
});

test("requires validation jobs and required steps to be unconditional", () => {
  expect(
    validateWorkflowValidationJobs("ci.yaml", [
      validationJob(["npm ci", "npm test"], { if: "always()" }),
    ]),
  ).toContain("must not conditionally skip or ignore failure of its validation job");
  const job = validationJob(["npm ci", "npm test"]);
  job.job.steps.find(({ run }) => run === "npm test").if = "always()";
  expect(validateWorkflowValidationJobs("ci.yaml", [job])).toContain(
    "must not conditionally skip or ignore failure of npm ci or npm test",
  );
});

test("requires every selected validation job to use Ubuntu", () => {
  const job = validationJob(["npm ci", "npm test"]);
  job.job["runs-on"] = "windows-latest";
  expect(validateWorkflowValidationJobs("ci.yaml", [job])).toBe(
    "ci.yaml validation jobs must run on an Ubuntu runner.",
  );
});

test("rejects prohibited publication commands and unapproved post-test actions", () => {
  expect(
    validateWorkflowValidationJobs("ci.yaml", [
      validationJob(["npm ci", "npm test", "npm publish"]),
    ]),
  ).toContain("may not run prohibited publishing commands after npm test");
  const steps = npmWorkflowSteps(["npm ci", "npm test"]);
  const action = { uses: "third-party/action@v1" };
  steps.push(action);
  expect(
    validateWorkflowValidationJobs("ci.yaml", [
      {
        job: { "runs-on": "ubuntu-latest", steps },
        commands: workflowCommands(steps),
      },
    ]),
  ).toContain("approved actions");
});
