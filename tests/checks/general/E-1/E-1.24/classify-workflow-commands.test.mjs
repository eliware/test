import { expect, test } from "@jest/globals";
import { findPublicationCommand, findUnsupportedCommands, isValidationWorkflowJob } from "../../../../../src/checks/general/E-1/E-1.24/classify-workflow-commands.mjs";

test("classifies publication and unsupported workflow commands", () => {
  expect(findPublicationCommand([{ command: "npm publish" }])).toEqual({ command: "npm publish" });
  expect(findPublicationCommand([{ command: "echo npm publish" }])).toBeUndefined();
  expect(findUnsupportedCommands([{ command: "curl https://example.test" }])).toEqual(["curl https://example.test"]);
  expect(findUnsupportedCommands([{ command: "npm ci" }, { command: "npm test" }, { command: "echo ready" }])).toEqual([]);
});

test("identifies reusable validation jobs from their command sequence", () => {
  const steps = (job) => job.steps;
  expect(isValidationWorkflowJob({ steps: [{ command: "npm ci" }, { command: "npm test" }] }, steps)).toBe(true);
  expect(isValidationWorkflowJob({ steps: [{ command: "npm test" }] }, steps)).toBe(false);
});
