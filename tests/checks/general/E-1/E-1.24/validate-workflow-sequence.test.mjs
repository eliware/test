import { expect, test } from "@jest/globals";
import { validateWorkflowSequence } from "../../../../../src/checks/general/E-1/E-1.24/validate-workflow-sequence.mjs";

test("requires npm ci before npm test", () => {
  expect(validateWorkflowSequence("ci.yml", [{ command: "npm test" }])).toBe(
    "ci.yml must validate with exactly one npm ci followed immediately by npm test.",
  );
  expect(
    validateWorkflowSequence("ci.yml", [{ command: "npm test" }, { command: "npm ci" }]),
  ).toContain("followed immediately");
  expect(
    validateWorkflowSequence("ci.yml", [{ command: "npm ci" }, { command: "npm test" }]),
  ).toBeNull();
  expect(
    validateWorkflowSequence("ci.yml", [{ command: "npm ci" }, { command: "npm test" }], null),
  ).toBeNull();
});

test("rejects intervening, duplicate, mutating, or skippable workflow steps", () => {
  const install = { run: "npm ci" };
  const middle = { run: "rm -rf node_modules" };
  const test = { run: "npm test" };
  expect(
    validateWorkflowSequence(
      "ci.yml",
      [
        { command: install.run, index: 0, step: install },
        { command: test.run, index: 1, step: test },
      ],
      [install, test],
    ),
  ).toBeNull();
  expect(
    validateWorkflowSequence(
      "ci.yml",
      [
        { command: install.run, index: 0, step: install },
        { command: "echo allowed reporting", index: 1, step: middle },
        { command: test.run, index: 2, step: test },
      ],
      [install, middle, test],
    ),
  ).toContain("no intervening steps");
  expect(
    validateWorkflowSequence(
      "ci.yml",
      [
        { command: install.run, index: 0, step: install },
        { command: "npm ci", index: 1, step: { run: "npm ci" } },
        { command: test.run, index: 2, step: test },
      ],
      [install, { run: "npm ci" }, test],
    ),
  ).toContain("exactly one");
  expect(
    validateWorkflowSequence(
      "ci.yml",
      [
        { command: install.run, index: 0, step: install },
        { command: test.run, index: 1, step: { ...test, "continue-on-error": true } },
      ],
      [install, { ...test, "continue-on-error": true }],
    ),
  ).toContain("no intervening steps");
  const skippedTest = { ...test, "continue-on-error": true };
  expect(
    validateWorkflowSequence(
      "ci.yml",
      [
        { command: install.run, index: 0, step: install },
        { command: skippedTest.run, index: 1, step: skippedTest },
      ],
      [install, skippedTest],
    ),
  ).toContain("ignore failure");
});

test("allows bounded setup and reporting around adjacent required commands", () => {
  const steps = [
    { run: "printf 'MAIL_OWNER_ADDRESS=test@eliware.org\\n' > .env" },
    { run: "printf 'MAIL_OWNER_ADDRESS=ops+ci@eliware.org\\n' > .env" },
    { run: "printf '%s\\n' 'validation complete'" },
    { run: "echo starting" },
    { run: "npm ci" },
    { run: "npm test" },
    { run: "printf done" },
  ];
  const commands = steps.map((step, index) => ({ command: step.run, step, index }));
  expect(validateWorkflowSequence("ci.yml", commands, steps, {})).toBeNull();
  expect(
    validateWorkflowSequence("ci.yml", [
      { command: "npm ci" },
      { command: "npm test" },
      { command: "rm -rf ." },
    ]),
  ).toContain("reporting commands after");
  expect(
    validateWorkflowSequence("ci.yml", [
      { command: "rm -rf ." },
      { command: "npm ci" },
      { command: "npm test" },
    ]),
  ).toContain("safe setup or reporting");
});

test("rejects conditionally skipped validation jobs and install steps", () => {
  const install = { run: "npm ci" };
  const testStep = { run: "npm test" };
  const commands = [
    { command: install.run, index: 0, step: install },
    { command: testStep.run, index: 1, step: testStep },
  ];
  expect(
    validateWorkflowSequence("ci.yml", commands, [install, testStep], { if: "false" }),
  ).toContain("conditionally skip");
  const conditionalInstall = { ...install, if: "runner.os == 'Linux'" };
  expect(
    validateWorkflowSequence(
      "ci.yml",
      [
        { command: conditionalInstall.run, index: 0, step: conditionalInstall },
        { command: testStep.run, index: 1, step: testStep },
      ],
      [conditionalInstall, testStep],
    ),
  ).toContain("conditionally skip");
});
