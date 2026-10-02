import { beforeEach, expect, jest, test } from "@jest/globals";

const isValidationWorkflowJob = jest.fn();
const validateWorkflowSiblingJobs = jest.fn();
const validateWorkflowValidationJobs = jest.fn();

jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/classify-workflow-commands.mjs",
  () => ({ isValidationWorkflowJob }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sibling-jobs.mjs",
  () => ({ validateWorkflowSiblingJobs }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-validation-jobs.mjs",
  () => ({ validateWorkflowValidationJobs }),
);

const { selectWorkflowValidationJobs } =
  await import("../../../../../src/checks/general/E-0.1/E-0.1.24/select-workflow-validation-jobs.mjs");
const validJob = { steps: [{ run: "npm ci" }, { run: "npm test" }] };

beforeEach(() => {
  jest.resetAllMocks();
  validateWorkflowValidationJobs.mockReturnValue(null);
  isValidationWorkflowJob.mockReturnValue(false);
  validateWorkflowSiblingJobs.mockReturnValue(null);
});

test("selects validation jobs and returns their normalized commands", () => {
  const result = selectWorkflowValidationJobs("ci.yml", { jobs: { validate: validJob } });

  expect(result).toEqual({
    error: null,
    jobs: [
      {
        id: "validate",
        job: validJob,
        commands: [
          { name: undefined, command: "npm ci", step: validJob.steps[0], index: 0 },
          { name: undefined, command: "npm test", step: validJob.steps[1], index: 1 },
        ],
      },
    ],
  });
  expect(validateWorkflowSiblingJobs).toHaveBeenCalledWith(
    "ci.yml",
    expect.arrayContaining([expect.objectContaining({ id: "validate" })]),
    new Set(["validate"]),
    new Set(),
  );
});

test("accepts a profile-validated GHCR publisher as a separate publication job", () => {
  const publisher = { steps: [{ run: "docker push ghcr.io/eliware/example" }] };
  const result = selectWorkflowValidationJobs(
    "publish.yml",
    {
      jobs: { validate: validJob, publish: publisher },
    },
    { publicationJobIds: new Set(["publish"]) },
  );

  expect(result.error).toBeNull();
  expect(validateWorkflowSiblingJobs).toHaveBeenCalledWith(
    "publish.yml",
    expect.arrayContaining([expect.objectContaining({ id: "publish" })]),
    new Set(["validate"]),
    new Set(["publish"]),
  );
});

test("maps missing validation jobs according to whether the workflow publishes", () => {
  expect(
    selectWorkflowValidationJobs(
      "publish.yml",
      { jobs: { publish: { steps: [] } } },
      { publicationJobIds: new Set(["publish"]) },
    ),
  ).toEqual({
    error: "publish.yml publication workflow must contain a separate validation job.",
    jobs: [],
  });
  expect(selectWorkflowValidationJobs("ci.yml", { jobs: {} })).toEqual({
    error: "ci.yml must validate with npm ci followed by npm test.",
    jobs: [],
  });
});

test("maps validation-command and sibling-validation findings", () => {
  validateWorkflowValidationJobs.mockReturnValueOnce(
    "ci.yml contains non-validation command(s): curl example.test.",
  );
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

test("rejects a name-labeled validation job without adjacent npm ci and npm test steps", () => {
  validateWorkflowValidationJobs.mockReturnValueOnce(
    "publish.yml must run npm ci followed immediately by npm test.",
  );
  const namedJob = { steps: [{ run: "echo ready" }] };

  expect(selectWorkflowValidationJobs("publish.yml", { jobs: { validate: namedJob } })).toEqual({
    error: "publish.yml must run npm ci followed immediately by npm test.",
    jobs: [],
  });
  expect(validateWorkflowValidationJobs).toHaveBeenCalledWith("publish.yml", [
    {
      id: "validate",
      job: namedJob,
      commands: [{ name: undefined, command: "echo ready", step: namedJob.steps[0], index: 0 }],
    },
  ]);
  expect(validateWorkflowSiblingJobs).not.toHaveBeenCalled();
});
