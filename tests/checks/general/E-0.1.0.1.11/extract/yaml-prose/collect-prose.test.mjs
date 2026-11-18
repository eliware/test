import { expect, test } from "@jest/globals";
import { parseDocument } from "yaml";
import collectYamlProse from "../../../../../../src/checks/general/E-0.1.0.1.11/extract/yaml-prose/collect-prose.mjs";
test("maps configured YAML scalars to prose blocks with source lines", () => {
  const source = [
    "directives:",
    "  - id: E-0.1.0.0.0",
    "    dos:",
    '      - "Use clear words."',
    "    description: This field is not prose here.",
    "    examples:",
    "      - description: Hidden example.",
    "description: A repository description.",
  ].join("\n");
  expect(collectYamlProse(source, parseDocument(source).contents)).toEqual([
    {
      text: "Use clear words.",
      line: 4,
      kind: "directive",
    },
    {
      text: "This field is not prose here.",
      line: 5,
      kind: "prose",
    },
    {
      text: "Hidden example.",
      line: 7,
      kind: "prose",
    },
    {
      text: "A repository description.",
      line: 8,
      kind: "prose",
    },
  ]);
});
test("ignores prose inside top-level example trees", () => {
  const source = [
    "examples:",
    "  - description: Example prose.",
    "description: Maintained prose.",
  ].join("\n");
  expect(collectYamlProse(source, parseDocument(source).contents)).toEqual([
    { text: "Maintained prose.", line: 3, kind: "prose" },
  ]);
});
