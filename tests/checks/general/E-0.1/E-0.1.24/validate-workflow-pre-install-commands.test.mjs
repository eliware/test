import { expect, test } from "@jest/globals";
import { validateWorkflowPreInstallCommands } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-pre-install-commands.mjs";
import {
  npm12WorkflowSteps,
  workflowCommands,
} from "../../../../../test-fixtures/npm-workflow-steps.mjs";

function compliantSetup(extraSteps = []) {
  const steps = npm12WorkflowSteps([]);
  steps.splice(0, 1, { uses: "actions/checkout@v6" }, steps[0]);
  steps.push(...extraSteps, { run: "npm ci" });
  return { steps, commands: workflowCommands(steps), installIndex: steps.length - 1 };
}

test("allows safe reporting before install", () => {
  expect(
    validateWorkflowPreInstallCommands("ci.yaml", [{ command: "echo starting" }], 1),
  ).toBeNull();
  expect(
    validateWorkflowPreInstallCommands("ci.yaml", [{ command: "printf 'starting validation'" }], 1),
  ).toBeNull();
  const fixture = compliantSetup([{ run: "echo starting" }]);
  expect(
    validateWorkflowPreInstallCommands(
      "ci.yaml",
      fixture.commands,
      fixture.installIndex,
      fixture.steps,
    ),
  ).toBeNull();
});

test("rejects file creation and other setup commands before install", () => {
  for (const command of [
    "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\\n' > .env",
    "Set-Content .env 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org'",
    "printf 'OTHER_SETTING=value\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=user@example.net\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=test@eliware.org\\n' > README.md",
    "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\\n' > README.md",
    "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\\n' > .env.local",
    "printf 'MAIL_OWNER_ADDRESS=test@eliware.org\\n' > .env.local",
    "printf '%s\\n' 'setup complete'",
    "printf '$GITHUB_TOKEN'",
    "printf 'MAIL_OWNER_ADDRESS=$(touch /tmp/pwned)@eliware.org\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=`touch /tmp/pwned`@eliware.org\\n' > .env",
    "echo $(touch /tmp/pwned)",
    "echo `touch /tmp/pwned`",
    "echo $GITHUB_TOKEN",
    "echo '$GITHUB_TOKEN'",
    "echo safe\nnpm publish",
    String.raw`echo safe\value`,
    "echo '${{ secrets.TOKEN }}'",
    'echo "${{ secrets.TOKEN }}"',
    "echo setup; touch /tmp/pwned",
    "echo setup | tee /tmp/output",
    "echo setup > .env",
    "echo 'x' > .env",
    'echo "x" > .env',
    'echo "safe\\\"; touch .env"',
    'echo "safe\\\\value"',
    'echo "safe\\\n npm publish"',
    "echo 'safe\\\n npm publish'",
    'echo "safe\n npm publish"',
    "echo 'safe\n npm publish'",
  ]) {
    expect(validateWorkflowPreInstallCommands("ci.yaml", [{ command }], 1)).toContain(
      "safe reporting",
    );
  }
});

test("rejects unquoted shell and workflow expansions in reporting commands", () => {
  for (const command of ["echo $TOKEN", "echo ${TOKEN}", "echo $(id)", "echo ${{ secrets.TOKEN }}"])
    expect(validateWorkflowPreInstallCommands("ci.yaml", [{ command }], 1)).toContain(
      "safe reporting",
    );
});

test("rejects unsupported script fields before install", () => {
  expect(
    validateWorkflowPreInstallCommands("ci.yaml", [], 1, [
      { script: "npm install attacker-package" },
    ]),
  ).toContain("safe reporting");
});

test("allows the approved setup actions and rejects unreviewed actions before install", () => {
  const valid = compliantSetup();
  expect(
    validateWorkflowPreInstallCommands("ci.yaml", valid.commands, valid.installIndex, valid.steps),
  ).toBeNull();
  const invalid = compliantSetup();
  invalid.steps.splice(0, 1, { uses: "someone/unreviewed-action@v1" });
  invalid.commands = workflowCommands(invalid.steps);
  expect(
    validateWorkflowPreInstallCommands(
      "ci.yaml",
      invalid.commands,
      invalid.installIndex,
      invalid.steps,
    ),
  ).toContain("safe reporting");
  const unsupportedSetup = compliantSetup();
  unsupportedSetup.steps[1] = { uses: "actions/setup-node@v6" };
  unsupportedSetup.commands = workflowCommands(unsupportedSetup.steps);
  expect(
    validateWorkflowPreInstallCommands(
      "ci.yaml",
      unsupportedSetup.commands,
      unsupportedSetup.installIndex,
      unsupportedSetup.steps,
    ),
  ).toContain("approved actions");
});

test("allows setup-node v7 in CI and publication workflows", () => {
  const validation = compliantSetup();
  expect(
    validateWorkflowPreInstallCommands(
      "publish.yaml job validate",
      validation.commands,
      validation.installIndex,
      validation.steps,
    ),
  ).toBeNull();
  const ci = compliantSetup();
  expect(
    validateWorkflowPreInstallCommands("ci.yaml job test", ci.commands, ci.installIndex, ci.steps),
  ).toBeNull();
});

test("ignores unapproved actions after install", () => {
  const steps = npm12WorkflowSteps(["npm ci", "npm test"]);
  const reporting = { uses: "someone/reporting-action@v1" };
  steps.push(reporting);
  const commands = workflowCommands(steps);
  expect(validateWorkflowPreInstallCommands("ci.yaml", commands, 3, steps)).toBeNull();
});
