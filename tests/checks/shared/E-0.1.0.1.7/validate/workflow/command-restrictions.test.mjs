import { expect, test } from "@jest/globals";
import { validateWorkflowCommandRestrictions } from "../../../../../../src/checks/shared/E-0.1.0.1.7/validate/workflow/command-restrictions.mjs";
import { packageVersion } from "../../../../../helpers/project-version.mjs";

const steps = [
  { uses: "actions/checkout@v7" },
  { uses: "actions/setup-node@v7", with: { "node-version": 26, cache: "npm" } },
  { run: "npm -g install npm@latest" },
  { run: "npm ci" },
  { run: "npm test" },
];

test("accepts approved commands and Node.js setup", () => {
  expect(validateWorkflowCommandRestrictions(steps)).toEqual([]);
  expect(
    validateWorkflowCommandRestrictions([
      steps[0],
      { ...steps[1], with: { "node-version": "26", cache: "npm" } },
      { run: "echo ready" },
      ...steps.slice(2),
    ]),
  ).toEqual([]);
});

test("rejects invalid setup values and checkout scope", () => {
  const changed = [
    { ...steps[0], with: { ref: "main" } },
    { ...steps[1], with: { "node-version": 20, "check-latest": true } },
    ...steps.slice(2),
  ];
  expect(validateWorkflowCommandRestrictions(changed).join(" ")).toContain(
    "must not override the checkout",
  );
  expect(validateWorkflowCommandRestrictions(changed).join(" ")).toContain("Node.js 26");
  expect(validateWorkflowCommandRestrictions(changed).join(" ")).toContain("npm cache inputs");
});

test("handles missing workflow stages without execution overrides", () => {
  expect(validateWorkflowCommandRestrictions([{ run: "echo ready" }]).join(" ")).toContain(
    "Node.js 26",
  );
});

test.each([{ run: "echo $TOKEN" }, { run: 'printf "safe\nunsafe"' }, { uses: "vendor/action@v1" }])(
  "rejects unapproved pre-install steps",
  (step) => {
    expect(
      validateWorkflowCommandRestrictions([...steps.slice(0, 2), step, ...steps.slice(2)]),
    ).toContain("ci.yaml has an unapproved step before npm ci.");
  },
);

test("rejects npm and GHCR publication commands", () => {
  const changed = [...steps, { run: "npm publish" }, { run: "docker push ghcr.io/a/b:latest" }];
  const errors = validateWorkflowCommandRestrictions(changed);
  expect(errors).toContain("ci.yaml validation job must not publish npm packages or GHCR images.");
});

test.each([
  "npx --yes npm@latest publish",
  "corepack pnpm@latest publish",
  "npx --yes docker push ghcr.io/eliware/app:latest",
  "npm exec -- docker buildx build --push -t ghcr.io/eliware/app:latest .",
])("rejects wrapped publication command %s", (run) => {
  expect(validateWorkflowCommandRestrictions([...steps, { run }])).toContain(
    "ci.yaml validation job must not publish npm packages or GHCR images.",
  );
});

test.each([
  "corepack pnpm@latest test",
  "npx --yes docker push registry.example.com/eliware/app:latest",
])("allows wrapped non-publication command %s", (run) => {
  expect(validateWorkflowCommandRestrictions([...steps, { run }])).toEqual([]);
});

test("allows extra non-publishing commands after npm test", () => {
  expect(
    validateWorkflowCommandRestrictions([
      ...steps,
      { run: "npm run lint", if: "always()", "continue-on-error": true },
      { run: "docker push registry.example.com/a/b:latest" },
      { run: `gh release create v${packageVersion}` },
    ]),
  ).toEqual([]);
});

test("rejects conditional required steps", () => {
  const errors = validateWorkflowCommandRestrictions(
    steps.map((step, index) => (index === 4 ? { ...step, if: "always()" } : step)),
  );
  expect(errors).toContain(
    "ci.yaml required validation steps must run unconditionally without continue-on-error.",
  );
});

test.each([3, 4])("rejects execution overrides on validation steps", (index) => {
  const changed = steps.map((step, stepIndex) =>
    stepIndex === index ? { ...step, shell: "bash" } : step,
  );
  expect(validateWorkflowCommandRestrictions(changed)).toContain(
    "npm install, npm ci, and npm test steps must not override env, shell, or working-directory.",
  );
});
