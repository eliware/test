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

const { validateWorkflowSequence } =
  await import("../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sequence.mjs");

const install = { command: "npm ci", step: { run: "npm ci" } };
const testCommand = { command: "npm test", step: { run: "npm test" } };
const commandIndex = (command) => (command === install ? 1 : 2);
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
  findValidationCommandPair.mockImplementation(() => {
    order.push("pair");
    return pair;
  });
  hasAdjacentValidationSteps.mockImplementation(() => {
    order.push("adjacency");
    return true;
  });
  validateValidationJobConditions.mockImplementation(() => {
    order.push("conditions");
    return null;
  });
  validateWorkflowPreInstallCommands.mockImplementation(() => {
    order.push("setup");
    return null;
  });
  validateWorkflowPostTestCommands.mockImplementation(() => {
    order.push("reporting");
    return null;
  });
  const commands = [install, testCommand];
  const steps = [install.step, testCommand.step];
  const job = { name: "validate" };

  expect(validateWorkflowSequence("ci.yaml", commands, steps, job)).toBeNull();
  expect(order).toEqual(["pair", "adjacency", "conditions", "setup", "reporting"]);
  expect(findValidationCommandPair).toHaveBeenCalledWith("ci.yaml", commands);
  expect(hasAdjacentValidationSteps).toHaveBeenCalledWith(install, testCommand, steps, commands);
  expect(validateValidationJobConditions).toHaveBeenCalledWith(install, testCommand, job);
  expect(validateWorkflowPreInstallCommands).toHaveBeenCalledWith("ci.yaml", commands, 0, steps);
  expect(validateWorkflowPostTestCommands).toHaveBeenCalledWith("ci.yaml", commands, 1, steps, {
    allowAttestation: false,
  });
});

test("uses original workflow positions when command records omit their indexes", () => {
  const installStep = { run: "npm ci" };
  const testStep = { run: "npm test" };
  const commands = [
    { command: "npm ci", step: installStep },
    { command: "npm test", step: testStep },
  ];
  const workflowSteps = [
    { uses: "actions/checkout@v6" },
    { uses: "actions/setup-node@v7" },
    installStep,
    testStep,
  ];
  findValidationCommandPair.mockReturnValueOnce({
    install: commands[0],
    test: commands[1],
    commandIndex: (entry) => commands.indexOf(entry),
  });

  expect(validateWorkflowSequence("ci.yaml", commands, workflowSteps)).toBeNull();
  expect(validateWorkflowPreInstallCommands).toHaveBeenCalledWith(
    "ci.yaml",
    commands,
    2,
    workflowSteps,
  );
  expect(validateWorkflowPostTestCommands).toHaveBeenCalledWith(
    "ci.yaml",
    commands,
    3,
    workflowSteps,
    { allowAttestation: false },
  );
});

test("rejects commands that cannot be mapped to original workflow steps", () => {
  const commands = [{ command: "npm ci" }, { command: "npm test" }];
  findValidationCommandPair.mockReturnValueOnce({
    install: commands[0],
    test: commands[1],
    commandIndex: (entry) => commands.indexOf(entry),
  });

  expect(validateWorkflowSequence("ci.yaml", commands, [{ uses: "actions/checkout@v6" }])).toBe(
    "ci.yaml must map npm ci and npm test to original workflow steps.",
  );
  expect(hasAdjacentValidationSteps).not.toHaveBeenCalled();
});

test("maps indexed commands through their original step references", () => {
  const installStep = { run: "npm ci" };
  const testStep = { run: "npm test" };
  const steps = [{ uses: "actions/checkout@v6" }, { run: "echo ready" }, installStep, testStep];
  const indexedInstall = { command: "npm ci", index: 2, step: installStep };
  const indexedTest = { command: "npm test", index: 3, step: testStep };
  findValidationCommandPair.mockReturnValueOnce({
    install: indexedInstall,
    test: indexedTest,
    commandIndex: () => -1,
  });

  expect(validateWorkflowSequence("ci.yaml", [indexedInstall, indexedTest], steps)).toBeNull();
  expect(validateWorkflowPreInstallCommands).toHaveBeenCalledWith(
    "ci.yaml",
    [indexedInstall, indexedTest],
    2,
    steps,
  );
  expect(validateWorkflowPostTestCommands).toHaveBeenCalledWith(
    "ci.yaml",
    [indexedInstall, indexedTest],
    3,
    steps,
    { allowAttestation: false },
  );
});

test("returns the first finding and skips later validation phases", () => {
  findValidationCommandPair.mockReturnValueOnce({ error: "command pair invalid" });
  expect(validateWorkflowSequence("ci.yaml", [])).toBe("command pair invalid");
  expect(hasAdjacentValidationSteps).not.toHaveBeenCalled();

  hasAdjacentValidationSteps.mockReturnValueOnce(false);
  expect(validateWorkflowSequence("ci.yaml", [], [install.step, testCommand.step])).toBe(
    "ci.yaml must run npm ci immediately followed by npm test with no intervening steps.",
  );
  expect(validateValidationJobConditions).not.toHaveBeenCalled();

  validateValidationJobConditions.mockReturnValueOnce("job conditions invalid");
  expect(validateWorkflowSequence("ci.yaml", [], [install.step, testCommand.step])).toBe(
    "ci.yaml job conditions invalid",
  );
  expect(validateWorkflowPreInstallCommands).not.toHaveBeenCalled();

  validateWorkflowPreInstallCommands.mockReturnValueOnce("setup invalid");
  expect(validateWorkflowSequence("ci.yaml", [], [install.step, testCommand.step])).toBe(
    "setup invalid",
  );
  expect(validateWorkflowPostTestCommands).not.toHaveBeenCalled();

  validateWorkflowPostTestCommands.mockReturnValueOnce("reporting invalid");
  expect(validateWorkflowSequence("ci.yaml", [], [install.step, testCommand.step])).toBe(
    "reporting invalid",
  );
});
