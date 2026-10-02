import { expect, test } from "@jest/globals";
import {
  findUnsupportedCommands,
  isValidationWorkflowJob,
} from "../../../../../src/checks/general/E-0.1/E-0.1.24/classify-workflow-commands.mjs";

test("classifies publication and unsupported workflow commands", () => {
  expect(findUnsupportedCommands([{ command: "curl https://example.test" }])).toEqual([
    "curl https://example.test",
  ]);
  expect(
    findUnsupportedCommands([
      { command: "npm publish" },
      { command: "docker push ghcr.io/eliware/example" },
      { command: "kubectl apply -f deploy.yml" },
      { command: "git push origin main" },
      { command: "git tag v1.0.0" },
    ]),
  ).toHaveLength(5);
  expect(findUnsupportedCommands([{ command: "echo npm publish" }])).toEqual([]);
  expect(
    findUnsupportedCommands([
      { command: "npm ci" },
      { command: "npm test" },
      { command: "echo ready" },
    ]),
  ).toEqual([]);
});

test("identifies reusable validation jobs from their command sequence", () => {
  const steps = (job) => job.steps;
  expect(
    isValidationWorkflowJob({ steps: [{ command: "npm ci" }, { command: "npm test" }] }, steps),
  ).toBe(true);
  expect(isValidationWorkflowJob({ steps: [{ command: "npm test" }] }, steps)).toBe(false);
  expect(
    isValidationWorkflowJob({ steps: [{ command: "npm test" }, { command: "npm ci" }] }, steps),
  ).toBe(false);
  expect(
    isValidationWorkflowJob(
      { steps: [{ command: "npm ci" }, { command: "echo ready" }, { command: "npm test" }] },
      steps,
    ),
  ).toBe(false);
});
