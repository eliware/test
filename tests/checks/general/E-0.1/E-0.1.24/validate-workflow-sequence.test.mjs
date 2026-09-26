import { expect, test } from "@jest/globals";
import { validateWorkflowSequence } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sequence.mjs";

test("requires npm ci before npm test", () => {
  expect(validateWorkflowSequence("ci.yml", [{ command: "npm test" }])).toBe(
    "ci.yml must validate with exactly one npm ci followed immediately by npm test.",
  );
  expect(
    validateWorkflowSequence("ci.yml", [{ command: "npm ci" }, { command: "npm test" }]),
  ).toBeNull();
});

test("rejects intervening steps and a validation step that ignores failures", () => {
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
    { run: "echo starting" },
    { run: "npm ci" },
    { run: "npm test" },
    { run: "printf done" },
  ];
  const commands = steps.map((step, index) => ({ command: step.run, step, index }));
  expect(validateWorkflowSequence("ci.yml", commands, steps, {})).toBeNull();
});

test("allows approved setup actions and rejects unreviewed actions before npm ci", () => {
  const checkout = { uses: "actions/checkout@v6" };
  const setupNode = { uses: "actions/setup-node@v6" };
  const install = { run: "npm ci" };
  const testStep = { run: "npm test" };
  const commands = [install, testStep].map((step, index) => ({ command: step.run, index: index + 2, step }));
  expect(validateWorkflowSequence("ci.yml", commands, [checkout, setupNode, install, testStep])).toBeNull();
  expect(validateWorkflowSequence("ci.yml", commands, [
    { uses: "someone/unreviewed-action@v1" }, setupNode, install, testStep,
  ])).toContain("safe setup or reporting");
});

test("maps unsafe setup and post-test commands through sequence validation", () => {
  expect(validateWorkflowSequence("ci.yml", [
    { command: "rm -rf ." }, { command: "npm ci" }, { command: "npm test" },
  ])).toContain("safe setup or reporting");
  expect(validateWorkflowSequence("ci.yml", [
    { command: "npm ci" }, { command: "npm test" }, { command: "rm -rf ." },
  ])).toContain("reporting commands after npm test");
});

test("rejects a condition that can skip the validation job", () => {
  const install = { run: "npm ci" };
  const testStep = { run: "npm test" };
  const commands = [
    { command: install.run, index: 0, step: install },
    { command: testStep.run, index: 1, step: testStep },
  ];
  expect(validateWorkflowSequence("ci.yml", commands, [install, testStep], { if: "false" })).toContain(
    "conditionally skip",
  );
});
