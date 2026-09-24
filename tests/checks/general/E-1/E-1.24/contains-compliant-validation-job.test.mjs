import { expect, test } from "@jest/globals";
import { containsCompliantValidationJob } from "../../../../../src/checks/general/E-1/E-1.24/contains-compliant-validation-job.mjs";

const compliantJob = {
  "runs-on": "ubuntu-latest",
  steps: [{ run: "npm ci" }, { run: "npm test" }],
};

test("finds a validation job with the supported runner and required sequence", () => {
  expect(containsCompliantValidationJob("ci.yml", { jobs: { validation: compliantJob } })).toBe(true);
  expect(containsCompliantValidationJob("ci.yml", null)).toBe(false);
});

test("ignores irrelevant, incomplete, and non-Ubuntu jobs", () => {
  expect(containsCompliantValidationJob("ci.yml", {
    jobs: { publish: compliantJob },
  })).toBe(false);
  expect(containsCompliantValidationJob("ci.yml", {
    jobs: { validate: { ...compliantJob, steps: [{ run: "npm test" }] } },
  })).toBe(false);
  expect(containsCompliantValidationJob("ci.yml", {
    jobs: { validate: { ...compliantJob, "runs-on": "windows-latest" } },
  })).toBe(false);
  expect(containsCompliantValidationJob("ci.yml", {
    jobs: { validate: { ...compliantJob, "runs-on": undefined } },
  })).toBe(false);
});

test("rejects unsafe or reversed command sequences", () => {
  expect(containsCompliantValidationJob("ci.yml", {
    jobs: { validate: { ...compliantJob, steps: [{ run: "npm test" }, { run: "npm ci" }] } },
  })).toBe(false);
});
