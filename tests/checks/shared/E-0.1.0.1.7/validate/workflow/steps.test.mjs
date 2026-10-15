import { expect, test } from "@jest/globals";
import { validateWorkflowSteps } from "../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/steps.mjs";

const steps = [
  { uses: "actions/checkout@v6" },
  { uses: "actions/setup-node@v7", with: { "node-version": 26, cache: "npm" } },
  { run: "npm -g install npm@latest" },
  { run: "npm ci" },
  { run: "npm test" },
];

test("coordinates all policies for valid ordered workflow steps", () => {
  expect(validateWorkflowSteps(steps)).toEqual([]);
});

test("allows additional commands after npm test", () => {
  expect(validateWorkflowSteps([...steps, { run: "npm run validate", if: "always()" }])).toEqual(
    [],
  );
});

test("combines errors from the step shape, order, and command policies", () => {
  const errors = validateWorkflowSteps([
    { uses: "actions/checkout@v6", name: "checkout" },
    { uses: "actions/setup-node@v7", with: { "node-version": 20 } },
    null,
    { run: "echo $TOKEN" },
    { run: "npm ci", shell: "bash" },
    { run: "npm publish", if: "always()" },
  ]);
  expect(errors).toContain("ci.yaml steps must use only approved keys and inputs.");
  expect(errors).toContain(
    "ci.yaml must use checkout v6, setup-node v7, npm latest, npm ci, then npm test.",
  );
  expect(errors).toContain("ci.yaml setup-node must use Node.js 26.");
  expect(errors).toContain("ci.yaml has an unapproved step before npm ci.");
  expect(errors).toContain("ci.yaml validation job must not publish npm packages or GHCR images.");
  expect(errors).toContain(
    "npm install, npm ci, and npm test steps must not override env, shell, or working-directory.",
  );
});
