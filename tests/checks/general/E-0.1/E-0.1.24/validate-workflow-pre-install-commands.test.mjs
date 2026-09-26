import { expect, test } from "@jest/globals";
import { validateWorkflowPreInstallCommands } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-pre-install-commands.mjs";

test("allows reporting and the specific mailbox owner setup before install", () => {
  for (const command of [
    "echo starting",
    "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\r\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\n' > .env\n",
    "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\r\n' > .env\r\n",
  ]) {
    expect(validateWorkflowPreInstallCommands("ci.yml", [{ command }], 1)).toBeNull();
  }
  expect(
    validateWorkflowPreInstallCommands(
      "ci.yml",
      [{ command: "echo starting" }, { command: "npm ci" }],
      1,
    ),
  ).toBeNull();
});

test("rejects other setup commands before install", () => {
  for (const command of [
    "printf 'OTHER_SETTING=value\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=user@example.net\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=test@eliware.org\\n' > README.md",
    "printf 'MAIL_OWNER_ADDRESS=test@eliware.org\\n' > .env.local",
    "printf '%s\\n' 'setup complete'",
    "printf 'MAIL_OWNER_ADDRESS=$(touch /tmp/pwned)@eliware.org\\n' > .env",
    "printf 'MAIL_OWNER_ADDRESS=`touch /tmp/pwned`@eliware.org\\n' > .env",
  ]) {
    expect(validateWorkflowPreInstallCommands("ci.yml", [{ command }], 1)).toContain(
      "safe setup or reporting",
    );
  }
});

test("accepts fixed literal PowerShell mailbox setup only with a PowerShell shell", () => {
  expect(validateWorkflowPreInstallCommands("ci.yml", [
    {
      command: "Set-Content .env 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org'",
      step: { shell: "pwsh" },
    },
  ], 1)).toBeNull();
  expect(validateWorkflowPreInstallCommands("ci.yml", [
    { command: "Set-Content .env 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org'" },
  ], 1)).toContain("safe setup");
  expect(validateWorkflowPreInstallCommands("ci.yml", [
    {
      command: "Set-Content .env 'MAIL_OWNER_ADDRESS=$(Get-ChildItem)@eliware.org'",
      step: { shell: "pwsh" },
    },
  ], 1)).toContain("safe setup");
  for (const value of [
    "$(Get-ChildItem)@eliware.org",
    "`$(Get-ChildItem)@eliware.org",
    "ops&ci@eliware.org",
  ]) {
    expect(validateWorkflowPreInstallCommands("ci.yml", [
      {
        command: `Set-Content .env 'MAIL_OWNER_ADDRESS=${value}'`,
        step: { shell: "pwsh" },
      },
    ], 1)).toContain("safe setup");
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
  )).toContain("safe setup or reporting");
  expect(validateWorkflowPreInstallCommands(
    "ci.yml",
    [{ command: "npm ci", index: 2 }],
    2,
    [
      { uses: "actions/checkout@v6" },
      { uses: "someone/unreviewed-action@v1" },
      { run: "npm ci" },
    ],
  )).toContain("safe setup or reporting");
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
