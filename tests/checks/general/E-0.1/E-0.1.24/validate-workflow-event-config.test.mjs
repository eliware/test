import { expect, test } from "@jest/globals";
import { validateWorkflowEventConfigs } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-event-config.mjs";

test("accepts supported event filters and input maps", () => {
  expect(
    validateWorkflowEventConfigs({
      push: { branches: ["main"], paths: ["src/**"] },
      pull_request: { branches: ["main"], types: ["opened"] },
      workflow_dispatch: { inputs: { deploy: { type: "boolean" } } },
      workflow_call: { inputs: {}, outputs: {}, secrets: {} },
      workflow_run: { workflows: ["Validation"], types: ["completed"], branches: ["main"] },
      repository_dispatch: { types: ["release"] },
      issues: { types: ["opened"] },
      schedule: [{ cron: "0 0 * * *" }],
    }),
  ).toBe(true);
});

test("rejects malformed fields even when sibling branch filters are valid", () => {
  expect(validateWorkflowEventConfigs({ push: { branches: ["main"], paths: {} } })).toBe(false);
  expect(validateWorkflowEventConfigs({ push: { branches: ["main"], unknown: ["value"] } })).toBe(
    false,
  );
  expect(validateWorkflowEventConfigs({ pull_request: { branches: ["main"], types: [7] } })).toBe(
    false,
  );
  expect(validateWorkflowEventConfigs({ schedule: [{ cron: "" }] })).toBe(false);
  expect(validateWorkflowEventConfigs({ workflow_dispatch: { inputs: [] } })).toBe(false);
});

test("accepts empty event maps and null shorthand but rejects invalid event shapes", () => {
  expect(validateWorkflowEventConfigs({ push: {}, pull_request: null, label: {} })).toBe(true);
  expect(validateWorkflowEventConfigs({ push: ["main"] })).toBe(false);
  expect(validateWorkflowEventConfigs({ custom_event: { unsupported: true } })).toBe(false);
});
