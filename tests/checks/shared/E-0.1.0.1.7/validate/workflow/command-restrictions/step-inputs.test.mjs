import { expect, test } from "@jest/globals";
import validateRequiredStepInputs from "../../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/command-restrictions/step-inputs.mjs";

test("requires canonical Node and checkout inputs", () => {
  expect(validateRequiredStepInputs([], [0, 1, 2, 3, 4])).toContain(
    "ci.yaml setup-node must use Node.js 26.",
  );
});

test("rejects workflow overrides on required install and test steps", () => {
  const steps = [
    { with: { repository: "other/repo" } },
    { with: { "node-version": 26, cache: "npm" } },
    { env: { CI: "false" } },
    { shell: "bash" },
    { "working-directory": "nested" },
  ];
  expect(validateRequiredStepInputs(steps, [0, 1, 2, 3, 4])).toHaveLength(4);
});
