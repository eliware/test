import { expect, test } from "@jest/globals";
import { validateCiWorkflowJob } from "../../../../../../src/checks/shared/E-0.1.0.1.7/validate/ci-workflow/job.mjs";

test("selects the single supported validation job", () => {
  const job = { "runs-on": "ubuntu-latest", steps: [] };
  expect(validateCiWorkflowJob({ jobs: { test: job } })).toEqual({ job, errors: [] });
});

test("reports invalid job keys, runners, and failure overrides", () => {
  const result = validateCiWorkflowJob({
    jobs: { other: { "runs-on": "windows-latest", if: "always()", steps: [], env: {} } },
  });
  expect(result.errors).toEqual(
    expect.arrayContaining([
      "ci.yaml must use `test` for the only validation job key.",
      "ci.yaml validation job must run on Ubuntu.",
      "ci.yaml validation job must run unconditionally without continue-on-error.",
      "ci.yaml validation job has unsupported keys: if, env.",
    ]),
  );
  expect(validateCiWorkflowJob({ jobs: {} }).errors).toContain(
    "ci.yaml must define a validation job with steps.",
  );
  expect(
    validateCiWorkflowJob({
      jobs: { test: { "runs-on": "ubuntu-latest", "continue-on-error": true, steps: [] } },
    }).errors,
  ).toContain("ci.yaml validation job must run unconditionally without continue-on-error.");
});
