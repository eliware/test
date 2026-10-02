import { expect, test } from "@jest/globals";
import {
  findUnsupportedCommands,
  isValidationWorkflowJob,
} from "../../../../../src/checks/general/E-0.1/E-0.1.24/classify-workflow-commands.mjs";

test("classifies unsupported pre-test commands and prohibited publishing commands", () => {
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

test("allows arbitrary commands after npm test except prohibited publishing commands", () => {
  const prefix = [{ command: "npm ci" }, { command: "npm test" }];
  expect(
    findUnsupportedCommands(
      [...prefix, { command: "rm -rf build" }, { command: "node scripts/deploy.mjs" }],
      { allowPostTestValidation: true },
    ),
  ).toEqual([]);
  expect(
    findUnsupportedCommands(
      [...prefix, { command: "npm publish" }, { command: "docker push ghcr.io/eliware/app" }],
      { allowPostTestValidation: true },
    ),
  ).toEqual(["npm publish", "docker push ghcr.io/eliware/app"]);
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
