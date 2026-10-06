import { expect, test } from "@jest/globals";
import { validateAgentsStructure } from "../../../../src/checks/general/E-0.1.0.1.2/validate-agents-structure.mjs";

const base = [
  "# AGENTS.md",
  "## Project",
  "## Scope and boundaries",
  "## Layout",
  "## Development",
  "## Validation",
  "## Security",
  "## Changes",
].join("\n");

test("accepts base headings without profile sections", () => {
  expect(validateAgentsStructure(base)).toEqual([]);
});

test("requires the exact title and ordered base headings", () => {
  expect(validateAgentsStructure(`Intro\n${base}`)).toEqual([
    "AGENTS.md must begin with # AGENTS.md.",
  ]);
  expect(validateAgentsStructure(base.replace("## Layout", "## Other"))).toEqual([
    "AGENTS.md must begin with the seven required headings in order.",
  ]);
});

test("orders selected profile headings by the canonical list", () => {
  expect(
    validateAgentsStructure(`${base}\n## Application\n## CLI`, {
      eliware: { apply: ["cli", "application"] },
    }),
  ).toEqual([]);
  expect(
    validateAgentsStructure(`${base}\n## CLI\n## Application`, {
      eliware: { apply: ["application", "cli"] },
    }),
  ).toEqual(["AGENTS.md profile headings must use canonical order after Changes."]);
});

test("rejects duplicate, unselected, and undeclared section headings", () => {
  expect(
    validateAgentsStructure(`${base}\n## Application\n## Application`, {
      eliware: { apply: ["application"] },
    }),
  ).toEqual(["AGENTS.md has duplicate, undeclared, or misordered section headings."]);
  expect(validateAgentsStructure(`${base}\n## Application`, { eliware: { apply: [] } })).toEqual([
    "AGENTS.md has duplicate, undeclared, or misordered section headings.",
  ]);
  expect(validateAgentsStructure(`${base}\n## Custom`, {}, new Set())).toEqual([
    "AGENTS.md has duplicate, undeclared, or misordered section headings.",
  ]);
});

test("accepts repository sections that a YAML specification declares", () => {
  expect(validateAgentsStructure(`${base}\n## Custom`, {}, new Set(["Custom"]))).toEqual([]);
});
