import { expect, test } from "@jest/globals";
import { validateWorkflowSequence } from "../../../../../src/checks/general/E-1/E-1.24/validate-workflow-sequence.mjs";

test("requires npm ci before npm test", () => {
  expect(validateWorkflowSequence("ci.yml", [{ command: "npm test" }])).toBe("ci.yml must validate with npm ci followed by npm test.");
  expect(validateWorkflowSequence("ci.yml", [{ command: "npm test" }, { command: "npm ci" }])).toContain("followed by");
  expect(validateWorkflowSequence("ci.yml", [{ command: "npm ci" }, { command: "npm test" }])).toBeNull();
});
