import { expect, test } from "@jest/globals";
import { validateWorkflowValidationJobs } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-validation-jobs.mjs";

test("accepts validation commands and rejects non-validation commands", () => {
  expect(validateWorkflowValidationJobs("ci.yml", [
    { commands: [{ command: "npm ci" }, { command: "npm test" }] },
  ])).toBeNull();
  expect(validateWorkflowValidationJobs("ci.yml", [
    { commands: [{ command: "npm ci" }, { command: "curl example.test" }] },
  ])).toBe("ci.yml contains non-validation command(s): curl example.test.");
});

test("reports the first validation job with an unsupported command", () => {
  expect(validateWorkflowValidationJobs("ci.yml", [
    { commands: [{ command: "npm test" }] },
    { commands: [{ command: "npm publish" }] },
  ])).toBe("ci.yml contains non-validation command(s): npm publish.");
});
