import { expect, test } from "@jest/globals";
import { findMissingAgentsSections, requiredSections } from "../../../../src/checks/general/E-1/validate-agents-required-sections.mjs";

const complete = ["# AGENTS.md", ...requiredSections.map((section) => `## ${section}`)].join("\n");

test("accepts every required AGENTS section", () => {
  expect(findMissingAgentsSections(complete)).toEqual([]);
});

test("reports missing AGENTS sections", () => {
  expect(findMissingAgentsSections(complete.replace("## Validation", ""))).toEqual(["Validation"]);
});

test("requires the AGENTS title to be the first content line", () => {
  expect(findMissingAgentsSections(`Intro\n${complete}`)).toEqual(["# AGENTS.md", ...requiredSections]);
});

test("enforces canonical profile heading order independently of package declaration order", () => {
  const profileAgents = `${complete}\n## Application\n## CLI\n## npm publication`;
  expect(findMissingAgentsSections(profileAgents, { eliware: { apply: ["cli", "npm-published", "application"] } })).toEqual([]);
  expect(findMissingAgentsSections(`${complete}\n## CLI\n## Application`, { eliware: { apply: ["application", "cli"] } })).toEqual(["canonical profile section order or undeclared section"]);
});
