import { expect, test } from "@jest/globals";
import { validateWorkflowPreInstallCommands } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-pre-install-commands.mjs";

test("allows safe reporting before install", () => {
  expect(validateWorkflowPreInstallCommands("ci.yml", [{ command: "echo starting" }], 1)).toBeNull();
  expect(
    validateWorkflowPreInstallCommands(
      "ci.yml",
      [{ command: "echo starting" }, { command: "npm ci" }],
      1,
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
    "printf 'MAIL_OWNER_ADDRESS=$(touch /tmp/pwned)@eliware.org\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=`touch /tmp/pwned`@eliware.org\\n' > .env",
    "echo $(touch /tmp/pwned)",
    "echo `touch /tmp/pwned`",
    "echo setup; touch /tmp/pwned",
    "echo setup | tee /tmp/output",
    "echo setup > .env",
  ]) {
    expect(validateWorkflowPreInstallCommands("ci.yml", [{ command }], 1)).toContain(
      "safe reporting",
    );
  }
});

test("allows the approved setup actions and rejects unreviewed actions before install", () => {
  const install = { run: "npm ci" };
  const commands = [{ command: install.run, index: 1, step: install }];
  expect(validateWorkflowPreInstallCommands(
    "ci.yml",
    commands,
    1,
    [{ uses: "actions/checkout@v6" }, install],
  )).toBeNull();
  expect(validateWorkflowPreInstallCommands(
    "ci.yml",
    commands,
    1,
    [{ uses: "someone/unreviewed-action@v1" }, install],
  )).toContain("safe reporting");
  expect(validateWorkflowPreInstallCommands(
    "ci.yml",
    [{ command: "npm ci", index: 2 }],
    2,
    [
      { uses: "actions/checkout@v6" },
      { uses: "someone/unreviewed-action@v1" },
      { run: "npm ci" },
    ],
  )).toContain("safe reporting");
});

test("allows setup-node v7 in CI and publication workflows", () => {
  const setup = { uses: "actions/setup-node@v7" };
  expect(validateWorkflowPreInstallCommands(
    "publish.yml job validate",
    [{ command: "npm ci", index: 1 }],
    1,
    [setup, { run: "npm ci" }],
  )).toBeNull();
  expect(validateWorkflowPreInstallCommands(
    "ci.yml job test",
    [{ command: "npm ci", index: 1 }],
    1,
    [setup, { run: "npm ci" }],
  )).toBeNull();
  expect(validateWorkflowPreInstallCommands(
    "ci.yml job test",
    [{ command: "npm ci", index: 1 }],
    1,
    [{ uses: "actions/setup-node@v6" }, { run: "npm ci" }],
  )).toContain("approved actions");
});

test("ignores unapproved actions after install", () => {
  const install = { run: "npm ci" };
  const testStep = { run: "npm test" };
  const reporting = { uses: "someone/reporting-action@v1" };
  const steps = [install, testStep, reporting];
  const commands = [
    { command: "npm ci", index: 0, step: install },
    { command: "npm test", index: 1, step: testStep },
  ];
  expect(validateWorkflowPreInstallCommands("ci.yml", commands, 0, steps)).toBeNull();
});
