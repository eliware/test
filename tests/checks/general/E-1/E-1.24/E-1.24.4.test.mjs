import { beforeEach, expect, jest, test } from "@jest/globals";

const readWorkflows = jest.fn();
const isValidationJob = jest.fn();
const workflowCommands = jest.fn();
const workflowJobs = jest.fn();
const workflowRunSteps = jest.fn();
const findPublicationCommand = jest.fn();
const findUnsupportedCommands = jest.fn();
const isValidationWorkflowJob = jest.fn();
const validateWorkflowSequence = jest.fn();
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.24/read-workflow-files.mjs", () => ({ readWorkflows }));
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.24/read-workflows.mjs", () => ({ isValidationJob, workflowCommands, workflowJobs, workflowRunSteps }));
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.24/classify-workflow-commands.mjs", () => ({ findPublicationCommand, findUnsupportedCommands, isValidationWorkflowJob }));
jest.unstable_mockModule("../../../../../src/checks/general/E-1/E-1.24/validate-workflow-sequence.mjs", () => ({ validateWorkflowSequence }));

const { run } = await import("../../../../../src/checks/general/E-1/E-1.24/E-1.24.4.mjs");
const job = { steps: [{ run: "npm ci" }, { run: "npm test" }] };
const commands = [{ job: "validate", command: "npm ci" }, { job: "validate", command: "npm test" }];

beforeEach(() => {
  jest.resetAllMocks();
  readWorkflows.mockResolvedValue([{ name: "ci.yml", document: {} }]);
  workflowCommands.mockReturnValue(commands);
  workflowJobs.mockReturnValue([{ id: "validate", job }]);
  workflowRunSteps.mockReturnValue(commands);
  isValidationJob.mockReturnValue(true);
  findPublicationCommand.mockReturnValue(null);
  findUnsupportedCommands.mockReturnValue([]);
  isValidationWorkflowJob.mockReturnValue(false);
  validateWorkflowSequence.mockReturnValue(null);
});

test("selects validation jobs and checks their command sequence", async () => {
  await expect(run({ root: "/repo" })).resolves.toEqual({ ruleId: "E-1.24.4", status: "pass", message: "" });
  expect(readWorkflows).toHaveBeenCalledWith("/repo");
  expect(workflowCommands).toHaveBeenCalledWith({});
  expect(workflowJobs).toHaveBeenCalledWith({});
  expect(workflowRunSteps).toHaveBeenCalledWith(job);
  expect(validateWorkflowSequence).toHaveBeenCalledWith("ci.yml job validate", commands, job.steps, job);
});

test("requires a separate validation job for publication workflows", async () => {
  findPublicationCommand.mockReturnValueOnce({ command: "npm publish" });
  workflowJobs.mockReturnValueOnce([{ id: "publish", job }]);
  isValidationJob.mockReturnValueOnce(false);
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-1.24.4",
    status: "fail",
    message: "ci.yml publication workflow must contain a separate validation job.",
  });
  expect(validateWorkflowSequence).not.toHaveBeenCalled();
});

test("requires validation for non-publication workflows and recognizes alternate validation jobs", async () => {
  workflowJobs.mockReturnValueOnce([]);
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-1.24.4",
    status: "fail",
    message: "ci.yml must validate with npm ci followed by npm test.",
  });
  isValidationJob.mockReturnValueOnce(false);
  isValidationWorkflowJob.mockReturnValueOnce(true);
  await expect(run({ root: "/repo" })).resolves.toEqual({ ruleId: "E-1.24.4", status: "pass", message: "" });
  expect(isValidationWorkflowJob).toHaveBeenCalledWith(job, workflowRunSteps);
});

test("maps command-policy, sequence, and workflow-loading errors", async () => {
  findUnsupportedCommands.mockReturnValueOnce(["curl"]);
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "ci.yml contains non-validation command(s): curl.",
  });
  validateWorkflowSequence.mockReturnValueOnce("npm ci must precede npm test");
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "npm ci must precede npm test",
  });
  readWorkflows.mockRejectedValueOnce(new Error("invalid YAML"));
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-1.24.4",
    status: "fail",
    message: "Workflow YAML could not be parsed: invalid YAML",
  });
});
