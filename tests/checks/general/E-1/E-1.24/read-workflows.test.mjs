import { expect, test } from "@jest/globals";
import {
  collectValues,
  workflowCommands,
  workflowJobs,
  workflowRunSteps,
  isValidationJob,
} from "../../../../../src/checks/general/E-1/E-1.24/read-workflows.mjs";

test("identifies validation jobs by their declared job identity", () => {
  expect(isValidationJob("validate", {})).toBe(true);
  expect(isValidationJob("publish", { name: "release" })).toBe(false);
});

test("collects typed values recursively without inspecting source text", () => {
  const document = {
    jobs: { test: { steps: [{ run: "npm ci" }, { uses: "actions/checkout@v6" }] } },
  };
  expect(collectValues(document, "run")).toEqual(["npm ci"]);
  expect(collectValues(document, "uses")).toEqual(["actions/checkout@v6"]);
  expect(collectValues([document, { run: "npm test" }], "run")).toEqual(["npm ci", "npm test"]);
  expect(collectValues(null, "run")).toEqual([]);
});

test("normalizes valid jobs and rejects missing, array, and null job maps", () => {
  const job = { steps: [{ name: "install", run: "  npm ci  " }, null, { uses: "actions/checkout@v6" }] };
  expect(workflowJobs({ jobs: { test: job, empty: null, scalar: "bad" } })).toEqual([
    { id: "test", job },
  ]);
  expect(workflowJobs()).toEqual([]);
  expect(workflowJobs({ jobs: [] })).toEqual([]);
  expect(workflowJobs({ jobs: "bad" })).toEqual([]);
});

test("extracts runnable steps and commands while ignoring malformed steps", () => {
  const job = {
    steps: [
      { name: "install", run: "  npm ci  " },
      { run: "npm test" },
      { run: 42 },
      null,
      { uses: "actions/checkout@v6" },
    ],
  };
  expect(workflowRunSteps(job)).toEqual([
    { name: "install", command: "npm ci", step: job.steps[0], index: 0 },
    { name: undefined, command: "npm test", step: job.steps[1], index: 1 },
  ]);
  expect(workflowRunSteps()).toEqual([]);
  expect(workflowRunSteps({ steps: "bad" })).toEqual([]);
  expect(workflowCommands({ jobs: { test: job, empty: {} } })).toEqual([
    { job: "test", name: "install", command: "npm ci", step: job.steps[0], index: 0 },
    { job: "test", name: undefined, command: "npm test", step: job.steps[1], index: 1 },
  ]);
});
