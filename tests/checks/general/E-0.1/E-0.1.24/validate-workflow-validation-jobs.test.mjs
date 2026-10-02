import { expect, test } from "@jest/globals";
import { validateWorkflowValidationJobs } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-validation-jobs.mjs";

function validationJob(commands, jobProperties = {}) {
  const steps = commands.map((run) => ({ run }));
  return {
    job: { "runs-on": "ubuntu-latest", ...jobProperties, steps },
    commands: steps.map((step, index) => ({ command: step.run, step, index })),
  };
}

test("accepts the required Ubuntu validation sequence and arbitrary post-test commands", () => {
  expect(
    validateWorkflowValidationJobs("ci.yml", [
      validationJob(["npm ci", "npm test", "node scripts/repository-check.mjs"]),
    ]),
  ).toBeNull();
});

test("rejects setup commands before npm ci", () => {
  expect(
    validateWorkflowValidationJobs("ci.yml", [
      validationJob(["curl example.test", "npm ci", "npm test"]),
    ]),
  ).toBe("ci.yml may only use approved actions; other steps must be safe reporting commands.");
});

test("rejects missing and non-adjacent npm ci and npm test commands", () => {
  expect(validateWorkflowValidationJobs("publish.yml", [validationJob([])])).toContain(
    "must run npm ci followed immediately by npm test",
  );
  const job = {
    job: {
      "runs-on": "ubuntu-latest",
      steps: [{ run: "npm ci" }, { uses: "actions/setup-node@v7" }, { run: "npm test" }],
    },
    commands: [
      { command: "npm ci", index: 0 },
      { command: "npm test", index: 2 },
    ],
  };
  expect(validateWorkflowValidationJobs("publish.yml", [job])).toContain(
    "must run npm ci immediately followed by npm test with no intervening steps",
  );
});

test("rejects validation jobs missing workflow metadata", () => {
  expect(
    validateWorkflowValidationJobs("ci.yml", [
      { commands: [{ command: "npm ci" }, { command: "npm test" }] },
    ]),
  ).toBe("ci.yml validation jobs must run on an Ubuntu runner.");
});

test("rejects every duplicate npm ci or npm test occurrence", () => {
  for (const commands of [
    ["npm ci", "npm test", "npm ci"],
    ["npm ci", "npm test", "npm test"],
  ]) {
    expect(validateWorkflowValidationJobs("ci.yml", [validationJob(commands)])).toContain(
      "must run npm ci followed immediately by npm test",
    );
  }
});

test("requires validation jobs and required steps to be unconditional", () => {
  expect(
    validateWorkflowValidationJobs("ci.yml", [
      validationJob(["npm ci", "npm test"], { if: "always()" }),
    ]),
  ).toContain("must not conditionally skip or ignore failure of its validation job");
  const job = validationJob(["npm ci", "npm test"]);
  job.job.steps[1].if = "always()";
  expect(validateWorkflowValidationJobs("ci.yml", [job])).toContain(
    "must not conditionally skip or ignore failure of npm ci or npm test",
  );
});

test("requires every selected validation job to use Ubuntu", () => {
  const job = validationJob(["npm ci", "npm test"]);
  job.job["runs-on"] = "windows-latest";
  expect(validateWorkflowValidationJobs("ci.yml", [job])).toBe(
    "ci.yml validation jobs must run on an Ubuntu runner.",
  );
});

test("rejects prohibited publication commands and unsupported post-test actions", () => {
  expect(
    validateWorkflowValidationJobs("ci.yml", [
      validationJob(["npm ci", "npm test", "npm publish"]),
    ]),
  ).toContain("may not run prohibited publishing commands after npm test");
  const install = { run: "npm ci" };
  const testStep = { run: "npm test" };
  const action = { uses: "third-party/action@v1" };
  expect(
    validateWorkflowValidationJobs("ci.yml", [
      {
        job: { "runs-on": "ubuntu-latest", steps: [install, testStep, action] },
        commands: [
          { command: install.run, step: install, index: 0 },
          { command: testStep.run, step: testStep, index: 1 },
        ],
      },
    ]),
  ).toContain("unsupported step forms");
});
