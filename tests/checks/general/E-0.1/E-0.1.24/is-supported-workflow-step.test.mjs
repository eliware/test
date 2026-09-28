import { expect, test } from "@jest/globals";
import { isSupportedWorkflowStep } from "../../../../../src/checks/general/E-0.1/E-0.1.24/is-supported-workflow-step.mjs";

test("accepts supported run and action step shapes", () => {
  expect(
    isSupportedWorkflowStep({ name: "validate", run: "echo ready", env: { CI: "true" } }),
  ).toBe(true);
  expect(
    isSupportedWorkflowStep({ uses: "actions/setup-node@v7", with: { "node-version": 26 } }),
  ).toBe(true);
});

test("rejects unsupported fields and invalid execution forms", () => {
  for (const step of [
    { script: "npm install attacker-package" },
    { command: "npm install attacker-package" },
    { run: "echo ready", uses: "actions/checkout@v6" },
    { run: "echo ready", with: { key: "value" } },
    { name: "no executable" },
    { run: "" },
    [],
    null,
  ])
    expect(isSupportedWorkflowStep(step)).toBe(false);
});
