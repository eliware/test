import { expect, test } from "@jest/globals";
import { workflowHasValidationEvents } from "../../../../../src/checks/general/E-0.1/E-0.1.24/workflow-validation-events.mjs";

const validationJob = {
  "runs-on": "ubuntu-latest",
  steps: [{ run: "npm ci" }, { run: "npm test" }],
};

function workflow(events, jobs = { validate: validationJob }) {
  return { on: events, jobs };
}

test("combines eligible push and pull-request triggers with compliant validation", () => {
  expect(workflowHasValidationEvents(workflow({ push: { branches: ["main"] }, pull_request: {} }))).toBe(true);
  expect(workflowHasValidationEvents(workflow({ push: { branches: ["main"] }, pull_request: {} }, {}))).toBe(false);
});

test("rejects workflows when either trigger does not target main", () => {
  expect(workflowHasValidationEvents(workflow({ push: { branches: ["release/*"] }, pull_request: {} }))).toBe(false);
  expect(workflowHasValidationEvents(workflow({ push: { branches: ["main"] }, pull_request: { branches: ["release/*"] } }))).toBe(false);
});

test("accepts normalized boolean-key aliases and event-array triggers", () => {
  expect(workflowHasValidationEvents({
    true: { push: ["main"], pull_request: [] },
    jobs: { validate: validationJob },
  })).toBe(true);
});
