import { expect, test } from "@jest/globals";
import { findWorkflowValidationJobs } from "../../../../../src/checks/general/E-0.1/E-0.1.24/find-workflow-validation-jobs.mjs";

test("selects named and command-classified validation jobs consistently", () => {
  const namedJob = { steps: [{ run: "npm ci" }] };
  const commandJob = { steps: [{ run: "npm ci" }, { run: "npm test" }] };
  const jobs = findWorkflowValidationJobs({
    jobs: { validate: namedJob, build: commandJob, release: { steps: [] } },
  });

  expect(jobs.map(({ id }) => id)).toEqual(["validate", "build"]);
  expect(jobs[0].commands).toHaveLength(1);
  expect(jobs[1].commands).toHaveLength(2);
});
