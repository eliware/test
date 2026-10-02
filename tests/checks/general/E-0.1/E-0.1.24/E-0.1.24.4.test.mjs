import { beforeEach, expect, jest, test } from "@jest/globals";

const readWorkflows = jest.fn();
const selectWorkflowValidationJobs = jest.fn();
const validateWorkflowSequence = jest.fn();
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/read-workflow-files.mjs",
  () => ({ readWorkflows }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/select-workflow-validation-jobs.mjs",
  () => ({ selectWorkflowValidationJobs }),
);
jest.unstable_mockModule(
  "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sequence.mjs",
  () => ({ validateWorkflowSequence }),
);

const { run } = await import("../../../../../src/checks/general/E-0.1/E-0.1.24/E-0.1.24.4.mjs");
const job = { steps: [{ run: "npm ci" }, { run: "npm test" }] };
const publicationJob = {
  steps: [{ uses: "docker/build-push-action@v6", with: { push: true } }],
};
const commands = [{ command: "npm ci" }, { command: "npm test" }];
const document = { jobs: { publish: publicationJob, validate: job } };

beforeEach(() => {
  jest.resetAllMocks();
  readWorkflows.mockResolvedValue([{ name: "ci.yml", document }]);
  selectWorkflowValidationJobs.mockReturnValue({
    error: null,
    jobs: [{ id: "validate", job, commands }],
  });
  validateWorkflowSequence.mockReturnValue(null);
});

test("composes workflow loading, validation-job selection, and sequence validation", async () => {
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.24.4",
    status: "pass",
    message: "",
  });
  expect(readWorkflows).toHaveBeenCalledWith("/repo", undefined);
  expect(selectWorkflowValidationJobs).toHaveBeenCalledWith("ci.yml", document, {
    publicationJobIds: new Set(),
  });
  expect(validateWorkflowSequence).toHaveBeenCalledWith(
    "ci.yml job validate",
    commands,
    job.steps,
    job,
    { allowAttestation: false },
  );
});

test("allows attestations only in GHCR publication jobs", async () => {
  readWorkflows.mockResolvedValueOnce([
    { name: "ci.yml", document },
    { name: "publish.yml", document },
  ]);
  await run({ root: "/repo", packageJson: { eliware: { apply: ["ghcr-published"] } } });

  expect(validateWorkflowSequence).toHaveBeenCalledWith(
    "ci.yml job validate",
    commands,
    job.steps,
    job,
    { allowAttestation: false },
  );

  selectWorkflowValidationJobs.mockReturnValue({
    error: null,
    jobs: [{ id: "publish", job: publicationJob, commands }],
  });
  validateWorkflowSequence.mockClear();
  await run({ root: "/repo", packageJson: { eliware: { apply: ["ghcr-published"] } } });

  expect(validateWorkflowSequence).toHaveBeenCalledWith(
    "ci.yml job publish",
    commands,
    publicationJob.steps,
    publicationJob,
    { allowAttestation: true },
  );
});

test("returns job-selection and sequence failures without inspecting later workflows", async () => {
  selectWorkflowValidationJobs.mockReturnValueOnce({ error: "validation job missing", jobs: [] });
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "validation job missing",
  });
  expect(validateWorkflowSequence).not.toHaveBeenCalled();

  validateWorkflowSequence.mockReturnValueOnce("npm ci must precede npm test");
  await expect(run({ root: "/repo" })).resolves.toMatchObject({
    status: "fail",
    message: "npm ci must precede npm test",
  });
});

test("maps workflow-loading errors to the rule result", async () => {
  readWorkflows.mockRejectedValueOnce(new Error("invalid YAML"));
  await expect(run({ root: "/repo" })).resolves.toEqual({
    ruleId: "E-0.1.24.4",
    status: "fail",
    message: "Workflow YAML could not be parsed: invalid YAML",
  });
  expect(selectWorkflowValidationJobs).not.toHaveBeenCalled();
});
