import { expect, test } from "@jest/globals";
import { selectWorkflowValidationJobs } from "../../../../../src/checks/general/E-0.1/E-0.1.24/select-workflow-validation-jobs.mjs";

const validJob = { steps: [{ run: "npm ci" }, { run: "npm test" }] };

test("selects a validation job and carries its normalized commands", () => {
  expect(selectWorkflowValidationJobs("ci.yml", { jobs: { validate: validJob } })).toEqual({
    error: null,
    jobs: [{
      id: "validate",
      job: validJob,
      commands: [
        { name: undefined, command: "npm ci", step: validJob.steps[0], index: 0 },
        { name: undefined, command: "npm test", step: validJob.steps[1], index: 1 },
      ],
    }],
  });
});

test("requires validation in both publication and ordinary workflows", () => {
  expect(selectWorkflowValidationJobs("publish.yml", {
    jobs: { publish: { steps: [{ run: "npm publish" }] } },
  })).toEqual({ error: "publish.yml publication workflow must contain a separate validation job.", jobs: [] });
  expect(selectWorkflowValidationJobs("ci.yml", { jobs: {} })).toEqual({
    error: "ci.yml must validate with npm ci followed by npm test.",
    jobs: [],
  });
});

test("leaves publication-job commands to publication-specific validation", () => {
  const validate = { steps: [{ run: "npm ci" }, { run: "npm test" }] };
  const publish = { needs: "validate", steps: [{ run: "npm publish --provenance" }] };
  expect(
    selectWorkflowValidationJobs("publish.yml", { jobs: { validate, publish } }),
  ).toEqual({
    error: null,
    jobs: [
      {
        id: "validate",
        job: validate,
        commands: [
          { name: undefined, command: "npm ci", step: validate.steps[0], index: 0 },
          { name: undefined, command: "npm test", step: validate.steps[1], index: 1 },
        ],
      },
    ],
  });
});

test("rejects unrelated unsafe jobs in a publication workflow", () => {
  const validate = { steps: [{ run: "npm ci" }, { run: "npm test" }] };
  const publish = { steps: [{ run: "npm publish --provenance" }] };
  const inspect = { steps: [{ run: "curl example.test" }] };
  expect(selectWorkflowValidationJobs("publish.yml", {
    jobs: { validate, publish, inspect },
  })).toMatchObject({
    error: "publish.yml contains non-validation command(s): curl example.test.",
    jobs: [],
  });
});

test("rejects unsupported commands in validation jobs", () => {
  expect(selectWorkflowValidationJobs("ci.yml", {
    jobs: { validate: { steps: [{ run: "npm ci" }, { run: "npm test" }, { run: "curl example.test" }] } },
  })).toEqual({ error: "ci.yml contains non-validation command(s): curl example.test.", jobs: [] });
});

test("rejects unsupported or unsafe commands in sibling workflow jobs", () => {
  expect(selectWorkflowValidationJobs("ci.yml", {
    jobs: {
      validate: validJob,
      deploy: { steps: [{ run: "curl example.test" }] },
    },
  })).toEqual({ error: "ci.yml contains non-validation command(s): curl example.test.", jobs: [] });
  expect(selectWorkflowValidationJobs("ci.yml", {
    jobs: {
      validate: validJob,
      setup: { steps: [{ run: "printf 'arbitrary=value\\n' > .env" }] },
    },
  })).toEqual({
    error: "ci.yml job setup may only use approved actions; other steps must be safe setup or reporting commands.",
    jobs: [],
  });
  expect(selectWorkflowValidationJobs("ci.yml", {
    jobs: {
      validate: validJob,
      setup: { steps: [{ run: "echo setup" }] },
    },
  }).error).toBeNull();
  expect(selectWorkflowValidationJobs("ci.yml", {
    jobs: {
      validate: validJob,
      setup: { steps: [{ run: "npm ci" }] },
    },
  })).toEqual({
    error: "ci.yml job setup must keep npm ci and npm test in a validation job.",
    jobs: [],
  });
});
