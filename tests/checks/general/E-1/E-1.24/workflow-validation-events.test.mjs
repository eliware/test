import { expect, test } from "@jest/globals";
import { workflowHasValidationEvents } from "../../../../../src/checks/general/E-1/E-1.24/workflow-validation-events.mjs";

test("evaluates supported push and runner shapes", () => {
  const events = { pull_request: {} };
  const jobs = { validate: { "runs-on": "ubuntu-latest" } };
  expect(workflowHasValidationEvents({ true: { ...events, push: { branches: ["main"] } }, jobs })).toBe(true);
  expect(workflowHasValidationEvents(null)).toBe(false);
  expect(workflowHasValidationEvents({ on: { ...events, push: {} }, jobs })).toBe(false);
  expect(workflowHasValidationEvents({ on: { ...events, push: { branches: ["main"] } }, jobs })).toBe(true);
  expect(workflowHasValidationEvents({ on: { ...events, push: ["main"] }, jobs })).toBe(true);
  expect(workflowHasValidationEvents({ on: { ...events, push: { branches: ["dev"] } }, jobs })).toBe(false);
  expect(workflowHasValidationEvents({ on: { ...events, push: null }, jobs: { validate: { "runs-on": ["ubuntu-latest"] } } })).toBe(false);
  expect(workflowHasValidationEvents({ on: "pull_request", jobs })).toBe(false);
  expect(workflowHasValidationEvents({ on: ["push", "pull_request"], jobs })).toBe(false);
  expect(workflowHasValidationEvents({ on: { ...events, push: {} }, jobs: { validate: null } })).toBe(false);
});
