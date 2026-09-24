import { expect, test } from "@jest/globals";
import { findValidationJobs } from "../../../src/checks/ghcr-published/find-validation-jobs.mjs";

test("selects only jobs containing both npm ci and npm test steps", () => {
  expect(findValidationJobs({ document: { jobs: {
    valid: { steps: [{ run: "npm ci" }, { run: "npm test" }] },
    installOnly: { steps: [{ run: "npm ci" }] },
    testOnly: { steps: [{ run: "npm test" }] },
    nullCommand: { steps: [{ run: null }, { run: "npm test" }] },
    missingTestCommand: { steps: [{ run: "npm ci" }, {}] },
  } } })).toEqual([expect.objectContaining({ id: "valid" })]);
});

test("returns no validation jobs for malformed or absent job surfaces", () => {
  expect(findValidationJobs({ document: { jobs: [] } })).toEqual([]);
  expect(findValidationJobs({ document: {} })).toEqual([]);
});
