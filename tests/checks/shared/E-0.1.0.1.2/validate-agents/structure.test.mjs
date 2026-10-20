import { expect, test } from "@jest/globals";
import { validateAgentsStructure } from "../../../../../src/checks/shared/E-0.1.0.1.2/validate-agents/structure.mjs";

const base = [
  "# AGENTS.md",
  ...[
    "Project",
    "Scope and boundaries",
    "Layout",
    "Development",
    "Validation",
    "Security",
    "Changes",
  ].flatMap((heading) => [`## ${heading}`, "Section text."]),
].join("\n");

test("accepts base headings with content and without profile sections", () => {
  expect(validateAgentsStructure(base)).toEqual([]);
});

test("rejects a blank section even when it has a nested heading", () => {
  const empty = base.replace("## Layout\nSection text.", "## Layout\n\n### Details");
  expect(validateAgentsStructure(empty)).toContain(
    "AGENTS.md section Layout must contain content.",
  );
});

test("requires the exact title and ordered base headings", () => {
  expect(validateAgentsStructure(`Intro\n${base}`)).toEqual([
    "AGENTS.md must begin with # AGENTS.md.",
  ]);
  expect(validateAgentsStructure(base.replace("## Layout", "## Other"))).toEqual([
    "AGENTS.md must begin with the seven required headings in order.",
  ]);
});

test("rejects duplicate or undeclared section headings", () => {
  expect(
    validateAgentsStructure(`${base}\n## Application\n## Application`, {
      eliware: { apply: ["application"] },
    }),
  ).toEqual(["AGENTS.md has duplicate, undeclared, or misordered section headings."]);
  expect(validateAgentsStructure(`${base}\n## Custom`, new Set())).toEqual([
    "AGENTS.md has duplicate, undeclared, or misordered section headings.",
  ]);
});

test("accepts repository sections that a YAML specification declares", () => {
  expect(validateAgentsStructure(`${base}\n## Custom\nCustom text.`, new Set(["Custom"]))).toEqual(
    [],
  );
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
