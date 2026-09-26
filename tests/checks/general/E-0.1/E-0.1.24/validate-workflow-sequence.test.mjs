import { expect, test } from "@jest/globals";
import { validateWorkflowSequence } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sequence.mjs";

function sequence(before = [], after = []) {
  const install = { run: "npm ci" };
  const testStep = { run: "npm test" };
  const steps = [...before, install, testStep, ...after];
  const commands = steps
    .map((step, index) => ({ command: step.run, step, index }))
    .filter(({ command }) => command);
  return { commands, steps };
}

test("accepts the composed install and test pipeline with safe setup and reporting", () => {
  const input = sequence([{ run: "echo starting" }], [{ run: "echo complete" }]);
  expect(validateWorkflowSequence("ci.yml", input.commands, input.steps)).toBeNull();
});

test("returns command-pair and adjacency findings before later policy checks", () => {
  expect(validateWorkflowSequence("ci.yml", [{ command: "npm test" }])).toContain(
    "exactly one npm ci",
  );
  const install = { run: "npm ci" };
  const middle = { run: "echo between" };
  const testStep = { run: "npm test" };
  const steps = [install, middle, testStep];
  const input = {
    steps,
    commands: steps.map((step, index) => ({ command: step.run, step, index })),
  };
  expect(validateWorkflowSequence("ci.yml", input.commands, input.steps)).toContain(
    "no intervening steps",
  );
});

test("checks validation job conditions before setup policy", () => {
  const input = sequence([{ run: "touch .env" }]);
  expect(validateWorkflowSequence("ci.yml", input.commands, input.steps, { if: "false" })).toContain(
    "conditionally skip",
  );
});

test("reports setup policy before post-test reporting policy", () => {
  const invalidBoth = sequence([{ run: "touch .env" }], [{ run: "rm -rf ." }]);
  expect(validateWorkflowSequence("ci.yml", invalidBoth.commands, invalidBoth.steps)).toContain(
    "safe setup or reporting",
  );
  const invalidReporting = sequence([], [{ run: "rm -rf ." }]);
  expect(validateWorkflowSequence("ci.yml", invalidReporting.commands, invalidReporting.steps)).toContain(
    "reporting commands after npm test",
  );
});
