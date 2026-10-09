import { expect, test } from "@jest/globals";
import { validateAgentsStructure } from "../../../../src/checks/shared/E-0.1.0.1.2/validate-agents-structure.mjs";
import { validateAgentsCompositionOrder } from "../../../../src/checks/shared/E-0.1.0.1.2/validate-agents-composition-order.mjs";

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

test("keeps profile ordering in the shared composition check", () => {
  expect(
    validateAgentsCompositionOrder(`${base}\n## Application\n## CLI`, {
      eliware: { apply: ["cli", "application"] },
    }),
  ).toEqual([]);
  expect(
    validateAgentsCompositionOrder(`${base}\n## CLI\n## Application`, {
      eliware: { apply: ["application", "cli"] },
    }),
  ).toEqual(["AGENTS.md profile headings must use canonical order after Changes."]);
  expect(
    validateAgentsCompositionOrder(`${base}\n## Application\n## Discord`, {
      eliware: { apply: ["general", "discord", "application"] },
    }),
  ).toEqual([]);
});

test("allows profile checks to require headings independently", () => {
  expect(
    validateAgentsCompositionOrder(`${base}\n## Documentation\n## Private distribution`, {
      eliware: { apply: ["general", "documentation", "private"] },
    }),
  ).toEqual([]);
  expect(
    validateAgentsCompositionOrder(base, {
      eliware: { apply: ["general", "documentation", "private"] },
    }),
  ).toEqual([]);
});

test("rejects duplicate, unselected, and undeclared section headings", () => {
  expect(
    validateAgentsStructure(`${base}\n## Application\n## Application`, {
      eliware: { apply: ["application"] },
    }),
  ).toEqual(["AGENTS.md has duplicate, undeclared, or misordered section headings."]);
  expect(
    validateAgentsCompositionOrder(`${base}\n## Application`, { eliware: { apply: [] } }),
  ).toEqual(["AGENTS.md profile headings must use canonical order after Changes."]);
  expect(validateAgentsStructure(`${base}\n## Custom`, new Set())).toEqual([
    "AGENTS.md has duplicate, undeclared, or misordered section headings.",
  ]);
});

test("accepts repository sections that a YAML specification declares", () => {
  expect(validateAgentsStructure(`${base}\n## Custom`, new Set(["Custom"]))).toEqual([]);
});

test("does not count required headings inside code blocks", () => {
  const content = `# AGENTS.md\n\n\`\`\`md\n${base}\n\`\`\``;
  expect(validateAgentsStructure(content)).toEqual([
    "AGENTS.md must begin with the seven required headings in order.",
  ]);
});

test("does not ignore a code block before the required title", () => {
  expect(validateAgentsStructure("```text\ncode\n```\n" + base)).toEqual([
    "AGENTS.md must begin with # AGENTS.md.",
  ]);
});
