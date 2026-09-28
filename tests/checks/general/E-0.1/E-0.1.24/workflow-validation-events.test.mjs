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
  expect(
    workflowHasValidationEvents(
      workflow({ push: { branches: ["main"] }, pull_request: { branches: ["main"] } }),
    ),
  ).toBe(true);
  expect(
    workflowHasValidationEvents(
      workflow({ push: { branches: ["main"] }, pull_request: { branches: ["main"] } }, {}),
    ),
  ).toBe(false);
});

test("rejects workflows when either trigger does not target main", () => {
  expect(
    workflowHasValidationEvents(workflow({ push: { branches: ["release/*"] }, pull_request: {} })),
  ).toBe(false);
  expect(
    workflowHasValidationEvents(
      workflow({ push: { branches: ["main"] }, pull_request: { branches: ["release/*"] } }),
    ),
  ).toBe(false);
});

test("rejects absent or empty trigger maps despite a compliant validation job", () => {
  expect(workflowHasValidationEvents({ jobs: { validate: validationJob } })).toBe(false);
  expect(workflowHasValidationEvents(workflow({}, { validate: validationJob }))).toBe(false);
});

test("does not treat a publication-labeled job as the validation job", () => {
  expect(
    workflowHasValidationEvents(
      workflow(
        { push: { branches: ["main"] }, pull_request: { branches: ["main"] } },
        { publish: validationJob },
      ),
    ),
  ).toBe(false);
});

test("accepts normalized boolean-key aliases and event-array triggers", () => {
  expect(
    workflowHasValidationEvents({
      true: { push: ["main"], pull_request: ["main"] },
      jobs: { validate: validationJob },
    }),
  ).toBe(true);
  expect(
    workflowHasValidationEvents(
      workflow({
        push: ["*", "!main*", "main"],
        pull_request: ["main"],
      }),
    ),
  ).toBe(true);
});

test("accepts supported configuration for additional workflow events", () => {
  expect(
    workflowHasValidationEvents(
      workflow({
        push: { branches: ["main"] },
        pull_request: { branches: ["main"] },
        workflow_dispatch: { inputs: { deploy: { type: "boolean" } } },
        label: { types: ["created"] },
      }),
    ),
  ).toBe(true);
});

test("rejects unrestricted triggers that do not explicitly select main", () => {
  expect(
    workflowHasValidationEvents(workflow({ push: {}, pull_request: { branches: ["main"] } })),
  ).toBe(false);
  expect(
    workflowHasValidationEvents(workflow({ push: { branches: ["main"] }, pull_request: {} })),
  ).toBe(false);
});

test("rejects malformed scalar event configurations instead of treating them as unrestricted", () => {
  expect(workflowHasValidationEvents(workflow({ push: "main", pull_request: {} }))).toBe(false);
  expect(workflowHasValidationEvents(workflow({ push: {}, pull_request: "main" }))).toBe(false);
  expect(workflowHasValidationEvents({ on: 7, jobs: { validate: validationJob } })).toBe(false);
});

test("rejects a malformed explicit on field instead of using the YAML true alias", () => {
  expect(
    workflowHasValidationEvents({
      on: null,
      true: { push: { branches: ["main"] }, pull_request: { branches: ["main"] } },
      jobs: { validate: validationJob },
    }),
  ).toBe(false);
});
