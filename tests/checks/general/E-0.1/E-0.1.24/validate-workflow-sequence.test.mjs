import { beforeEach, expect, jest, test } from "@jest/globals";

const findValidationCommandPair = jest.fn();
const hasAdjacentValidationSteps = jest.fn();
const validateValidationJobConditions = jest.fn();
const validateWorkflowPreInstallCommands = jest.fn();
const validateWorkflowPostTestCommands = jest.fn();

jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/find-validation-command-pair.mjs",
  () => ({ findValidationCommandPair }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/has-adjacent-validation-steps.mjs",
  () => ({ hasAdjacentValidationSteps }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-validation-job-conditions.mjs",
  () => ({ validateValidationJobConditions }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-pre-install-commands.mjs",
  () => ({ validateWorkflowPreInstallCommands }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-post-test-commands.mjs",
  () => ({ validateWorkflowPostTestCommands }),
);

const { validateWorkflowSequence } = await import(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sequence.mjs"
);

const install = { command: "npm ci" };
const testCommand = { command: "npm test" };
const commandIndex = (command) => command === install ? 1 : 2;
const pair = { install, test: testCommand, commandIndex };

beforeEach(() => {
  jest.resetAllMocks();
  findValidationCommandPair.mockReturnValue(pair);
  hasAdjacentValidationSteps.mockReturnValue(true);
  validateValidationJobConditions.mockReturnValue(null);
  validateWorkflowPreInstallCommands.mockReturnValue(null);
  validateWorkflowPostTestCommands.mockReturnValue(null);
});

test("coordinates sequence validators in order with their owning inputs", () => {
  const order = [];
  findValidationCommandPair.mockImplementation(() => { order.push("pair"); return pair; });
  hasAdjacentValidationSteps.mockImplementation(() => { order.push("adjacency"); return true; });
  validateValidationJobConditions.mockImplementation(() => { order.push("conditions"); return null; });
  validateWorkflowPreInstallCommands.mockImplementation(() => { order.push("setup"); return null; });
  validateWorkflowPostTestCommands.mockImplementation(() => { order.push("reporting"); return null; });
  const commands = [install, testCommand];
  const steps = [{ name: "install" }, { name: "test" }];
  const job = { name: "validate" };

  expect(validateWorkflowSequence("ci.yml", commands, steps, job)).toBeNull();
  expect(order).toEqual(["pair", "adjacency", "conditions", "setup", "reporting"]);
  expect(findValidationCommandPair).toHaveBeenCalledWith("ci.yml", commands);
  expect(hasAdjacentValidationSteps).toHaveBeenCalledWith(install, testCommand, steps, commands);
  expect(validateValidationJobConditions).toHaveBeenCalledWith(install, testCommand, job);
  expect(validateWorkflowPreInstallCommands).toHaveBeenCalledWith("ci.yml", commands, 1, steps, job);
  expect(validateWorkflowPostTestCommands).toHaveBeenCalledWith("ci.yml", commands, 2, steps);
});

test("returns the first finding and skips later validation phases", () => {
  findValidationCommandPair.mockReturnValueOnce({ error: "command pair invalid" });
  expect(validateWorkflowSequence("ci.yml", [])).toBe("command pair invalid");
  expect(hasAdjacentValidationSteps).not.toHaveBeenCalled();

  hasAdjacentValidationSteps.mockReturnValueOnce(false);
  expect(validateWorkflowSequence("ci.yml", [])).toBe(
    "ci.yml must run npm ci immediately followed by npm test with no intervening steps.",
  );
  expect(validateValidationJobConditions).not.toHaveBeenCalled();

  validateValidationJobConditions.mockReturnValueOnce("job conditions invalid");
  expect(validateWorkflowSequence("ci.yml", [])).toBe("ci.yml job conditions invalid");
  expect(validateWorkflowPreInstallCommands).not.toHaveBeenCalled();

  validateWorkflowPreInstallCommands.mockReturnValueOnce("setup invalid");
  expect(validateWorkflowSequence("ci.yml", [])).toBe("setup invalid");
  expect(validateWorkflowPostTestCommands).not.toHaveBeenCalled();

  validateWorkflowPostTestCommands.mockReturnValueOnce("reporting invalid");
  expect(validateWorkflowSequence("ci.yml", [])).toBe("reporting invalid");
});
