import { beforeEach, expect, jest, test } from "@jest/globals";

const findPublicationCommand = jest.fn();
const findUnsupportedCommands = jest.fn();
const isValidationWorkflowJob = jest.fn();
const validateWorkflowSiblingJobs = jest.fn();

jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/classify-workflow-commands.mjs",
  () => ({ findPublicationCommand, findUnsupportedCommands, isValidationWorkflowJob }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sibling-jobs.mjs",
  () => ({ validateWorkflowSiblingJobs }),
);

const { selectWorkflowValidationJobs } = await import(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/select-workflow-validation-jobs.mjs"
);
const validJob = { steps: [{ run: "npm ci" }, { run: "npm test" }] };

beforeEach(() => {
  jest.resetAllMocks();
  findPublicationCommand.mockReturnValue(undefined);
  findUnsupportedCommands.mockReturnValue([]);
  isValidationWorkflowJob.mockReturnValue(false);
  validateWorkflowSiblingJobs.mockReturnValue(null);
});

test("selects validation jobs and returns their normalized commands", () => {
  const result = selectWorkflowValidationJobs("ci.yml", { jobs: { validate: validJob } });

  expect(result).toEqual({
    error: null,
    jobs: [{
      id: "validate",
      job: validJob,
      commands: [
        { name: undefined, command: "npm ci", step: validJob.steps[0], index: 0 },
        { name: undefined, command: "npm test", step: validJob.steps[1], index: 1 },
      ],
    }],
  });
  expect(validateWorkflowSiblingJobs).toHaveBeenCalledWith(
    "ci.yml",
    expect.arrayContaining([expect.objectContaining({ id: "validate" })]),
    new Set(["validate"]),
    false,
  );
});

test("maps missing validation jobs according to whether the workflow publishes", () => {
  findPublicationCommand.mockReturnValueOnce({ command: "npm publish" });
  expect(selectWorkflowValidationJobs("publish.yml", { jobs: { publish: { steps: [] } } })).toEqual({
    error: "publish.yml publication workflow must contain a separate validation job.",
    jobs: [],
  });
  expect(selectWorkflowValidationJobs("ci.yml", { jobs: {} })).toEqual({
    error: "ci.yml must validate with npm ci followed by npm test.",
    jobs: [],
  });
});

test("maps command-classification and sibling-validation findings", () => {
  findUnsupportedCommands.mockReturnValueOnce(["curl example.test"]);
  expect(selectWorkflowValidationJobs("ci.yml", { jobs: { validate: validJob } })).toEqual({
    error: "ci.yml contains non-validation command(s): curl example.test.",
    jobs: [],
  });
  expect(validateWorkflowSiblingJobs).not.toHaveBeenCalled();

  validateWorkflowSiblingJobs.mockReturnValueOnce("sibling job invalid");
  expect(selectWorkflowValidationJobs("ci.yml", { jobs: { validate: validJob } })).toEqual({
    error: "sibling job invalid",
    jobs: [],
  });
});
