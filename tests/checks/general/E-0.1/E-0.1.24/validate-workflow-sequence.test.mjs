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

const install = { command: "npm ci" };
const testCommand = { command: "npm test" };
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
  const steps = [{ name: "install" }, { name: "test" }];
  const job = { name: "validate" };

  expect(validateWorkflowSequence("ci.yaml", commands, steps, job)).toBeNull();
  expect(order).toEqual(["pair", "adjacency", "conditions", "setup", "reporting"]);
  expect(findValidationCommandPair).toHaveBeenCalledWith("ci.yaml", commands);
  expect(hasAdjacentValidationSteps).toHaveBeenCalledWith(install, testCommand, steps, commands);
  expect(validateValidationJobConditions).toHaveBeenCalledWith(install, testCommand, job);
  expect(validateWorkflowPreInstallCommands).toHaveBeenCalledWith("ci.yaml", commands, 1, steps);
  expect(validateWorkflowPostTestCommands).toHaveBeenCalledWith("ci.yaml", commands, 2, steps, {
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

test("falls back to command positions when workflow command records have no step", () => {
  const commands = [{ command: "npm ci" }, { command: "npm test" }];
  findValidationCommandPair.mockReturnValueOnce({
    install: commands[0],
    test: commands[1],
    commandIndex: (entry) => commands.indexOf(entry),
  });

  expect(
    validateWorkflowSequence("ci.yaml", commands, [{ uses: "actions/checkout@v6" }]),
  ).toBeNull();
  expect(validateWorkflowPreInstallCommands).toHaveBeenCalledWith("ci.yaml", commands, 0, [
    { uses: "actions/checkout@v6" },
  ]);
  expect(validateWorkflowPostTestCommands).toHaveBeenCalledWith(
    "ci.yaml",
    commands,
    1,
    [{ uses: "actions/checkout@v6" }],
    { allowAttestation: false },
  );
});

test("preserves indexes already attached to workflow commands", () => {
  const indexedInstall = { command: "npm ci", index: 4 };
  const indexedTest = { command: "npm test", index: 5 };
  findValidationCommandPair.mockReturnValueOnce({
    install: indexedInstall,
    test: indexedTest,
    commandIndex: () => -1,
  });

  expect(validateWorkflowSequence("ci.yaml", [indexedInstall, indexedTest])).toBeNull();
  expect(validateWorkflowPreInstallCommands).toHaveBeenCalledWith(
    "ci.yaml",
    [indexedInstall, indexedTest],
    4,
    [indexedInstall, indexedTest],
  );
  expect(validateWorkflowPostTestCommands).toHaveBeenCalledWith(
    "ci.yaml",
    [indexedInstall, indexedTest],
    5,
    [indexedInstall, indexedTest],
    { allowAttestation: false },
  );
});

test("returns the first finding and skips later validation phases", () => {
  findValidationCommandPair.mockReturnValueOnce({ error: "command pair invalid" });
  expect(validateWorkflowSequence("ci.yaml", [])).toBe("command pair invalid");
  expect(hasAdjacentValidationSteps).not.toHaveBeenCalled();

  hasAdjacentValidationSteps.mockReturnValueOnce(false);
  expect(validateWorkflowSequence("ci.yaml", [])).toBe(
    "ci.yaml must run npm ci immediately followed by npm test with no intervening steps.",
  );
  expect(validateValidationJobConditions).not.toHaveBeenCalled();

  validateValidationJobConditions.mockReturnValueOnce("job conditions invalid");
  expect(validateWorkflowSequence("ci.yaml", [])).toBe("ci.yaml job conditions invalid");
  expect(validateWorkflowPreInstallCommands).not.toHaveBeenCalled();

  validateWorkflowPreInstallCommands.mockReturnValueOnce("setup invalid");
  expect(validateWorkflowSequence("ci.yaml", [])).toBe("setup invalid");
  expect(validateWorkflowPostTestCommands).not.toHaveBeenCalled();

  validateWorkflowPostTestCommands.mockReturnValueOnce("reporting invalid");
  expect(validateWorkflowSequence("ci.yaml", [])).toBe("reporting invalid");
});
