import { expect, test } from "@jest/globals";
import { validateWorkflowSteps } from "../../../../src/checks/general/E-0.1.0.1.7/validate-workflow-steps.mjs";

const steps = [
  { uses: "actions/checkout@v6" },
  { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
  { run: "npm -g install npm@latest" },
  { run: "npm ci" },
  { run: "npm test" },
];

test("accepts the required ordered validation steps", () => {
  expect(validateWorkflowSteps(steps)).toEqual([]);
});

test("accepts literal reporting before the npm install", () => {
  expect(
    validateWorkflowSteps([
      steps[0],
      steps[1],
      { run: 'printf "Installing latest npm"' },
      ...steps.slice(2),
    ]),
  ).toEqual([]);
});

test("rejects missing, reordered, duplicate, and unsupported stage steps", () => {
  const result = validateWorkflowSteps([
    { uses: "actions/checkout@v5", with: { repository: "other/repo", ref: "dev" } },
    { uses: "actions/setup-node@v7", with: { "node-version": 20 } },
    { run: "echo $TOKEN" },
    { run: "npm ci" },
    { run: "npm test" },
    { run: "npm test" },
    { run: "npm publish" },
  ]);
  expect(result.join(" ")).toContain("must use checkout v6");
  expect(result.join(" ")).toContain("Node.js 26");
  expect(result.join(" ")).toContain("npm ci, then npm test");
  expect(result.join(" ")).toContain("unapproved step");
  expect(result.join(" ")).toContain("publication commands");
});

test("rejects missing test commands and checkout overrides", () => {
  const result = validateWorkflowSteps([
    { uses: "actions/checkout@v6", with: { ref: "main" } },
    { uses: "actions/setup-node@v7", with: { "node-version": "26" } },
    { run: "npm -g install npm@latest" },
    { run: "npm ci", shell: "bash" },
  ]);
  expect(result.join(" ")).toContain("must not override the checkout");
  expect(result.join(" ")).toContain("then npm test");
  expect(result.join(" ")).toContain("must not override env, shell");
});

test("rejects conditional validation steps", () => {
  expect(
    validateWorkflowSteps(
      steps.map((step, index) => (index === 3 ? { ...step, if: "always()" } : step)),
    ),
  ).toContain("ci.yaml validation steps must run unconditionally without continue-on-error.");
});

test("rejects duplicate validation stages after npm test", () => {
  expect(validateWorkflowSteps([...steps, { run: "npm run lint" }])).toContain(
    "ci.yaml must not duplicate aggregate validation stages.",
  );
});
