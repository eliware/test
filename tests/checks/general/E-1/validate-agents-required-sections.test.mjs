import { expect, test } from "@jest/globals";
import { findMissingAgentsSections, requiredSections } from "../../../../src/checks/general/E-1/validate-agents-required-sections.mjs";

const complete = requiredSections.map((section) => `## ${section}`).join("\n");

test("accepts every required AGENTS section", () => {
  expect(findMissingAgentsSections(complete)).toEqual([]);
});

test("reports missing AGENTS sections", () => {
  expect(findMissingAgentsSections(complete.replace("## Validation", ""))).toEqual(["Validation"]);
});
