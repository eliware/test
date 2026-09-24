import { expect, test } from "@jest/globals";
import { hasAdjacentValidationSteps } from "../../../../../src/checks/general/E-1/E-1.24/has-adjacent-validation-steps.mjs";

test("recognizes adjacent workflow steps and rejects an intervening reporting step", () => {
  const install = { run: "npm ci" };
  const testStep = { run: "npm test" };
  expect(hasAdjacentValidationSteps({ step: install }, { step: testStep }, [install, testStep], [])).toBe(true);
  expect(hasAdjacentValidationSteps({ step: install }, { step: testStep }, [install, { run: "echo reporting" }, testStep], [])).toBe(false);
});

test("uses the command sequence when workflow-step references are unavailable", () => {
  const install = { command: "npm ci" };
  const testStep = { command: "npm test" };
  expect(hasAdjacentValidationSteps(install, testStep, null, [install, testStep])).toBe(true);
});
