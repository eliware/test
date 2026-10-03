import { expect, test } from "@jest/globals";
import { containsCompliantValidationJob } from "../../../../../src/checks/general/E-0.1/E-0.1.24/contains-compliant-validation-job.mjs";

const compliantJob = {
  "runs-on": "ubuntu-latest",
  steps: [{ run: "npm ci" }, { run: "npm test" }],
};

test("finds a validation job with the supported runner and required sequence", () => {
  expect(containsCompliantValidationJob("ci.yaml", { jobs: { validation: compliantJob } })).toBe(
    true,
  );
  expect(containsCompliantValidationJob("ci.yaml", null)).toBe(false);
});

test("ignores irrelevant, incomplete, and non-Ubuntu jobs", () => {
  expect(
    containsCompliantValidationJob("ci.yaml", {
      jobs: { publish: compliantJob },
    }),
  ).toBe(false);
  expect(
    containsCompliantValidationJob("ci.yaml", {
      jobs: { validate: { ...compliantJob, steps: [{ run: "npm test" }] } },
    }),
  ).toBe(false);
  expect(
    containsCompliantValidationJob("ci.yaml", {
      jobs: { validate: { ...compliantJob, "runs-on": "windows-latest" } },
    }),
  ).toBe(false);
  expect(
    containsCompliantValidationJob("ci.yaml", {
      jobs: { validate: { ...compliantJob, "runs-on": undefined } },
    }),
  ).toBe(false);
});

test("rejects unsafe or reversed command sequences", () => {
  expect(
    containsCompliantValidationJob("ci.yaml", {
      jobs: { validate: { ...compliantJob, steps: [{ run: "npm test" }, { run: "npm ci" }] } },
    }),
  ).toBe(false);
});
