import { expect, test } from "@jest/globals";
import { validateWorkflowSiblingJobs } from "../../../../../src/checks/general/E-0.1/E-0.1.24/validate-workflow-sibling-jobs.mjs";

const validationIds = new Set(["validate"]);
const commands = (command) => [{ command }];

test("ignores validation and publication jobs", () => {
  const jobs = [{ id: "validate", commands: commands("curl example.test") }];
  expect(validateWorkflowSiblingJobs("ci.yml", jobs, validationIds, false)).toBeNull();
  expect(validateWorkflowSiblingJobs("publish.yml", [{ id: "publish", commands: commands("npm publish") }], validationIds, true)).toBeNull();
});

test("rejects unsafe commands and validation commands placed in sibling jobs", () => {
  expect(validateWorkflowSiblingJobs("ci.yml", [{ id: "deploy", commands: commands("curl example.test") }], validationIds, false)).toBe(
    "ci.yml contains non-validation command(s): curl example.test.",
  );
  expect(validateWorkflowSiblingJobs("ci.yml", [{ id: "setup", commands: commands("npm test") }], validationIds, false)).toBe(
    "ci.yml job setup must keep npm ci and npm test in a validation job.",
  );
});

test("applies pre-install safety policy to sibling reporting and setup steps", () => {
  expect(validateWorkflowSiblingJobs("ci.yml", [{ id: "setup", commands: commands("echo setup") }], validationIds, false)).toBeNull();
  expect(validateWorkflowSiblingJobs("ci.yml", [{ id: "setup", commands: commands("printf 'arbitrary=value\\n' > .env") }], validationIds, false)).toBe(
    "ci.yml job setup may only run safe setup or reporting commands before npm ci.",
  );
});
