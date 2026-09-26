import { expect, test } from "@jest/globals";
import { workflowHasValidationEvents } from "../../../../../src/checks/general/E-0.1/E-0.1.24/workflow-validation-events.mjs";

test("evaluates supported push and runner shapes", () => {
  const events = { pull_request: {} };
  const jobs = {
    validate: {
      "runs-on": "ubuntu-latest",
      steps: [{ run: "npm ci" }, { run: "npm test" }],
    },
  };
  expect(
    workflowHasValidationEvents({ true: { ...events, push: { branches: ["main"] } }, jobs }),
  ).toBe(true);
  expect(workflowHasValidationEvents(null)).toBe(false);
  expect(workflowHasValidationEvents({ on: { ...events, push: {} }, jobs })).toBe(true);
  expect(
    workflowHasValidationEvents({ on: { ...events, push: { branches: ["main"] } }, jobs }),
  ).toBe(true);
  expect(workflowHasValidationEvents({ on: { ...events, push: ["main"] }, jobs })).toBe(true);
  expect(
    workflowHasValidationEvents({ on: { ...events, push: { branches: ["dev"] } }, jobs }),
  ).toBe(false);
  expect(
    workflowHasValidationEvents({
      on: { ...events, push: { branches: ["main"], "branches-ignore": ["main"] } },
      jobs,
    }),
  ).toBe(false);
  expect(
    workflowHasValidationEvents({ on: { ...events, push: { branches: ["main", "!main"] } }, jobs }),
  ).toBe(false);
  expect(
    workflowHasValidationEvents({
      on: { ...events, push: { branches: ["main"], "branches-ignore": ["release/*", null] } },
      jobs,
    }),
  ).toBe(true);
  expect(
    workflowHasValidationEvents({
      on: { ...events, push: { branches: ["*", "!main", "main"] } },
      jobs,
    }),
  ).toBe(true);
  expect(
    workflowHasValidationEvents({
      on: { ...events, push: { branches: ["*", null, "!release/*"] } },
      jobs,
    }),
  ).toBe(true);
  expect(
    workflowHasValidationEvents({
      on: { ...events, push: { branches: [], "branches-ignore": [] } },
      jobs,
    }),
  ).toBe(true);
  expect(
    workflowHasValidationEvents({
      on: { ...events, push: { branches: ["*"], "branches-ignore": ["m*"] } },
      jobs,
    }),
  ).toBe(false);
  expect(workflowHasValidationEvents({ on: { ...events, push: true }, jobs })).toBe(true);
  expect(
    workflowHasValidationEvents({
      on: { ...events, push: null },
      jobs: { validate: { "runs-on": ["ubuntu-latest"] } },
    }),
  ).toBe(false);
  expect(workflowHasValidationEvents({ on: "pull_request", jobs })).toBe(false);
  expect(workflowHasValidationEvents({ on: ["push", "pull_request"], jobs })).toBe(true);
  expect(workflowHasValidationEvents({
    on: { push: { branches: ["main"] }, pull_request: null }, jobs,
  })).toBe(false);
  expect(workflowHasValidationEvents({
    on: { push: { branches: ["main"] }, pull_request: [] },
    jobs: {
      validate: {
        "runs-on": ["ubuntu-latest"],
        steps: [{ run: "npm ci" }, { run: "npm test" }],
      },
    },
  })).toBe(true);
  expect(workflowHasValidationEvents({
    on: {
      push: { branches: ["main"] },
      pull_request: { "branches-ignore": ["main"] },
    },
    jobs,
  })).toBe(false);
  expect(
    workflowHasValidationEvents({ on: { ...events, push: {} }, jobs: { validate: null } }),
  ).toBe(false);
});

test("applies ordered branch exclusions and re-inclusions to YAML event-key aliases", () => {
  const jobs = {
    validate: {
      "runs-on": "ubuntu-latest",
      steps: [{ run: "npm ci" }, { run: "npm test" }],
    },
  };
  const yamlBooleanOn = (branches) => ({
    true: { push: { branches }, pull_request: {} },
    jobs,
  });

  expect(workflowHasValidationEvents(yamlBooleanOn(["*", "!main"]))).toBe(false);
  expect(workflowHasValidationEvents(yamlBooleanOn(["!main"]))).toBe(false);
  expect(workflowHasValidationEvents(yamlBooleanOn(["!release/*"]))).toBe(false);
  expect(workflowHasValidationEvents(yamlBooleanOn(["*", "!main", "main"]))).toBe(true);
  expect(
    workflowHasValidationEvents({
      on: { push: { branches: ["release/*", "!release/main", "main"] }, pull_request: {} },
      jobs,
    }),
  ).toBe(true);
});

test("matches GitHub glob semantics for overlapping branch filters", () => {
  const jobs = {
    validate: {
      "runs-on": "ubuntu-latest",
      steps: [{ run: "npm ci" }, { run: "npm test" }],
    },
  };
  const workflow = (branches) => ({
    on: { push: { branches }, pull_request: {} },
    jobs,
  });

  expect(workflowHasValidationEvents(workflow(["**/main", "!**/main"]))).toBe(false);
  expect(workflowHasValidationEvents(workflow(["**", "!**/main"]))).toBe(false);
  expect(workflowHasValidationEvents(workflow(["**", "!**/main", "main"]))).toBe(true);
  expect(workflowHasValidationEvents(workflow(["**", "!**/main", "main", "!main"]))).toBe(false);
  expect(workflowHasValidationEvents(workflow(["main", "release/*"]))).toBe(true);
});

test("requires Ubuntu and main-target pull requests on the validation job", () => {
  const base = {
    on: { push: { branches: ["main"] }, pull_request: {} },
    jobs: {
      ubuntu: { "runs-on": "ubuntu-latest", steps: [{ run: "echo unrelated" }] },
      validate: { "runs-on": "windows-latest", steps: [{ run: "npm ci" }, { run: "npm test" }] },
    },
  };
  expect(workflowHasValidationEvents(base)).toBe(false);
  expect(workflowHasValidationEvents({
    ...base,
    jobs: {
      validate: { "runs-on": "ubuntu-latest", steps: [{ run: "npm ci" }, { run: "npm test" }] },
    },
  })).toBe(true);
  expect(workflowHasValidationEvents({
    ...base,
    on: { push: { branches: ["main"] }, pull_request: { branches: ["!main"] } },
    jobs: {
      validate: { "runs-on": "ubuntu-latest", steps: [{ run: "npm ci" }, { run: "npm test" }] },
    },
  })).toBe(false);
});

test("requires an adjacent unconditional npm ci/npm test sequence", () => {
  const on = { push: { branches: ["main"] }, pull_request: {} };
  const workflow = (steps) => ({ on, jobs: { validate: { "runs-on": "ubuntu-latest", steps } } });
  expect(workflowHasValidationEvents(workflow([
    { run: "npm ci" }, { run: "echo skipped" }, { run: "npm test" },
  ]))).toBe(false);
  expect(workflowHasValidationEvents(workflow([
    { if: "false", run: "npm ci" }, { run: "npm test" },
  ]))).toBe(false);
  expect(workflowHasValidationEvents(workflow([
    { run: "npm ci" }, { "continue-on-error": true, run: "npm test" },
  ]))).toBe(false);
});
