import { expect, test } from "@jest/globals";
import { validateValidationJobConditions } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-validation-job-conditions.mjs";

test("accepts unconditional required validation steps", () => {
  expect(validateValidationJobConditions({ step: {} }, { step: {} }, {})).toBeNull();
});

test("rejects skippable jobs and required steps", () => {
  expect(validateValidationJobConditions({}, {}, { if: "false" })).toContain("validation job");
  expect(validateValidationJobConditions({ step: { if: "false" } }, { step: {} }, {})).toContain(
    "npm ci or npm test",
  );
  expect(validateValidationJobConditions({ step: {} }, { step: { if: "always()" } }, {})).toContain(
    "npm ci or npm test",
  );
  expect(
    validateValidationJobConditions({ step: {} }, { step: { "continue-on-error": true } }, {}),
  ).toContain("npm ci or npm test");
  expect(
    validateValidationJobConditions({ step: { continueOnError: true } }, { step: {} }, {}),
  ).toContain("npm ci or npm test");
  expect(validateValidationJobConditions({}, {}, { "continue-on-error": true })).toContain(
    "validation job",
  );
});

test("rejects failure-tolerant npm ci and npm test steps", () => {
  for (const field of ["continue-on-error", "continueOnError"]) {
    expect(
      validateValidationJobConditions({ step: { [field]: true } }, { step: {} }, {}),
    ).toContain("npm ci or npm test");
    expect(
      validateValidationJobConditions({ step: {} }, { step: { [field]: true } }, {}),
    ).toContain("npm ci or npm test");
  }
});

test.each(["env", "shell", "working-directory", "with"])(
  "rejects %s overrides on required npm steps",
  (field) => {
    expect(
      validateValidationJobConditions(
        { step: { [field]: field === "env" ? { NODE_OPTIONS: "--require=x" } : "override" } },
        { step: {} },
        {},
      ),
    ).toContain("override npm ci or npm test");
  },
);
