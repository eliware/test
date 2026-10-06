import { expect, test } from "@jest/globals";
import { validateWorkflowSteps } from "../../../../src/checks/general/E-0.1.0.1.7/validate-workflow-steps.mjs";

const steps = [
  { uses: "actions/checkout@v6" },
  { uses: "actions/setup-node@v7", with: { "node-version": 26, cache: "npm" } },
  { run: "npm -g install npm@latest" },
  { run: "npm ci" },
  { run: "npm test" },
];

test("accepts the required ordered validation steps", () => {
  expect(validateWorkflowSteps(steps)).toEqual([]);
});

test("accepts null workflow entries and safe reporting commands", () => {
  expect(
    validateWorkflowSteps([...steps.slice(0, 2), { run: "echo ready" }, ...steps.slice(2)]),
  ).toEqual([]);
  expect(validateWorkflowSteps([...steps, null])).toContain(
    "ci.yaml npm test must be the final validation-job step.",
  );
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

test("reports a missing setup-node input map", () => {
  expect(
    validateWorkflowSteps([steps[0], { uses: "actions/setup-node@v7" }, ...steps.slice(2)]),
  ).toContain("ci.yaml setup-node must use Node.js 26.");
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

test("rejects environment overrides on npm installation and validation steps", () => {
  const changed = steps.map((step) => (step.run === "npm ci" ? { ...step, env: {} } : step));
  expect(validateWorkflowSteps(changed)).toContain(
    "npm install, npm ci, and npm test steps must not override env, shell, or working-directory.",
  );
});

test("rejects conditional validation steps", () => {
  expect(
    validateWorkflowSteps(
      steps.map((step, index) => (index === 3 ? { ...step, if: "always()" } : step)),
    ),
  ).toContain("ci.yaml validation steps must run unconditionally without continue-on-error.");
});

test.each([
  "pnpm publish",
  "yarn npm publish",
  "bun publish",
  "npm --workspace app publish",
  "docker build --push docker.io/x",
  "gh release create v1.0.0",
])("rejects publication command %s", (run) => {
  expect(validateWorkflowSteps([...steps.slice(0, -1), { run }, steps.at(-1)])).toContain(
    "ci.yaml validation job must not include publication commands.",
  );
});

test("rejects duplicate validation stages after npm test", () => {
  expect(validateWorkflowSteps([...steps, { run: "npm run lint" }])).toContain(
    "ci.yaml must not duplicate aggregate validation stages.",
  );
});

test.each([
  "npm run test",
  "node bin/eliware-test.mjs --lint",
  "eliware-test --format-check",
  "npx eliware-test --audit",
  "npm exec -- eliware-test --pack",
  "npm outdated",
  "pnpm run lint",
  "yarn test",
  "bun run format:check",
])("rejects duplicate stage command %s", (run) => {
  expect(validateWorkflowSteps([...steps, { run }])).toContain(
    "ci.yaml must not duplicate aggregate validation stages.",
  );
});

test("requires npm test to be the final job step", () => {
  expect(validateWorkflowSteps([...steps, { uses: "third-party/publish-action@v1" }])).toContain(
    "ci.yaml npm test must be the final validation-job step.",
  );
});

test("rejects sparse checkout options", () => {
  const checkout = { ...steps[0], with: { "sparse-checkout": "src/" } };
  expect(validateWorkflowSteps([checkout, ...steps.slice(1)])).toContain(
    "ci.yaml must not override the checkout repository, ref, or sparse scope.",
  );
});

test("rejects unsupported workflow step keys and setup-node inputs", () => {
  const changed = steps.map((step, index) =>
    index === 1 ? { ...step, with: { ...step.with, "check-latest": true } } : step,
  );
  expect(validateWorkflowSteps(changed)).toContain(
    "ci.yaml setup-node may use only node-version 26 and npm cache inputs.",
  );
  expect(
    validateWorkflowSteps([{ ...steps[0], name: "checkout" }, ...steps.slice(1)]).join(" "),
  ).toContain("steps must use only approved keys and inputs");
});

test("rejects reporting commands with embedded line breaks", () => {
  const changed = [steps[0], steps[1], { run: 'echo "safe\nunsafe"' }, ...steps.slice(2)];
  expect(validateWorkflowSteps(changed)).toContain("ci.yaml has an unapproved step before npm ci.");
});
