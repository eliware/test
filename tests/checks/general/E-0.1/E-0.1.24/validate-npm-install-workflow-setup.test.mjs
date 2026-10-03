import { expect, test } from "@jest/globals";
import {
  npmLatestInstallCommand,
  validateNpmInstallWorkflowSetup,
} from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-npm-install-workflow-setup.mjs";

const createSteps = () => [
  { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
  { run: npmLatestInstallCommand },
  { run: "npm ci" },
  { run: "npm test" },
];
const toCommands = (steps) =>
  steps.flatMap((step, index) => (step.run ? [{ command: step.run, index, step }] : []));

test("requires npm latest installation after Node setup and before npm ci", () => {
  expect(npmLatestInstallCommand).toBe("npm -g install npm@latest");
  const steps = createSteps();
  expect(validateNpmInstallWorkflowSetup("ci.yaml", toCommands(steps), 2, steps)).toBeNull();
  expect(
    validateNpmInstallWorkflowSetup("ci.yaml", toCommands(steps), 2, steps, {
      requireSetup: true,
    }),
  ).toBeNull();
});

test.each(["v7", "v7.0.0", "v7.1.2"])("accepts approved setup-node version %s", (version) => {
  const steps = createSteps();
  steps[0].uses = `actions/setup-node@${version}`;
  expect(validateNpmInstallWorkflowSetup("ci.yaml", toCommands(steps), 2, steps)).toBeNull();
});

test("rejects a missing, unexpected, duplicate, or misplaced npm installer", () => {
  const steps = createSteps();
  const misplaced = createSteps();
  [misplaced[1], misplaced[2]] = [misplaced[2], misplaced[1]];
  for (const commands of [
    toCommands(steps).filter(({ command }) => command !== npmLatestInstallCommand),
    toCommands(steps).map((entry) =>
      entry.command === npmLatestInstallCommand
        ? { ...entry, command: "npm install npm@latest" }
        : entry,
    ),
    [...toCommands(steps), toCommands(steps)[0]],
    toCommands(misplaced),
  ]) {
    expect(validateNpmInstallWorkflowSetup("ci.yaml", commands, 2, steps)).toContain(
      "must run npm -g install npm@latest",
    );
  }
});

test("rejects invalid or conditional Node setup and conditional npm installation", () => {
  const steps = createSteps();
  steps[0].with["node-version"] = 20;
  expect(validateNpmInstallWorkflowSetup("ci.yaml", toCommands(steps), 2, steps)).toContain(
    "must run npm -g install npm@latest",
  );
  steps[0].with["node-version"] = 26;
  steps[1].if = "always()";
  expect(validateNpmInstallWorkflowSetup("ci.yaml", toCommands(steps), 2, steps)).toContain(
    "must run npm -g install npm@latest",
  );
});

test("rejects missing and duplicate setup-node steps", () => {
  const steps = createSteps();
  expect(
    validateNpmInstallWorkflowSetup("ci.yaml", toCommands(steps), 2, steps.slice(1)),
  ).toContain("must run npm -g install npm@latest");
  expect(
    validateNpmInstallWorkflowSetup("ci.yaml", toCommands(steps), 2, [
      ...steps,
      { uses: "actions/setup-node@v7", with: { "node-version": 26 } },
    ]),
  ).toContain("must run npm -g install npm@latest");
});

test("supports commands linked to original steps without numeric indexes", () => {
  const steps = createSteps();
  const commands = toCommands(steps).map(({ command, step }) => ({ command, step }));
  expect(validateNpmInstallWorkflowSetup("ci.yaml", commands, 2, steps)).toBeNull();
  expect(
    validateNpmInstallWorkflowSetup(
      "ci.yaml",
      commands.map(({ command }) => ({ command })),
      2,
      steps,
    ),
  ).toContain("must run npm -g install npm@latest");
});

test("does not require setup for unrelated jobs without npm ci", () => {
  expect(validateNpmInstallWorkflowSetup("ci.yaml", [{ command: "echo reporting" }], 1)).toBeNull();
});
