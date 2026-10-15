import { expect, test } from "@jest/globals";
import { validateWorkflowStepOrder } from "../../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/step/order.mjs";

const steps = [
  { uses: "actions/checkout@v6", with: { "fetch-depth": 0 } },
  { uses: "actions/setup-node@v7" },
  { run: "npm -g install npm@latest" },
  { run: "npm ci" },
  { run: "npm test" },
];

test("accepts each required stage in its canonical position", () => {
  expect(validateWorkflowStepOrder(steps)).toEqual([]);
});

test("rejects missing, reordered, or duplicate required stages", () => {
  expect(validateWorkflowStepOrder([...steps.slice(1), steps[0], steps[4]])).toEqual(
    expect.arrayContaining([
      "ci.yaml must use checkout v6, setup-node v7, npm latest, npm ci, then npm test.",
    ]),
  );
});

test("allows additional steps after npm test", () => {
  expect(validateWorkflowStepOrder([...steps, { run: "npm run validate" }])).toEqual([]);
});
