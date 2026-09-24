import { expect, test } from "@jest/globals";
import { workflowHasValidationEvents } from "../../../../../src/checks/general/E-1/E-1.24/workflow-validation-events.mjs";

test("evaluates supported push and runner shapes", () => {
  const events = { pull_request: {} };
  const jobs = { validate: { "runs-on": "ubuntu-latest" } };
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
  expect(
    workflowHasValidationEvents({ on: { ...events, push: {} }, jobs: { validate: null } }),
  ).toBe(false);
});

test("applies ordered branch exclusions and re-inclusions to YAML event-key aliases", () => {
  const jobs = { validate: { "runs-on": "ubuntu-latest" } };
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
