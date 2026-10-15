import { expect, test } from "@jest/globals";
import { extractYamlProse } from "../../../../src/checks/general/E-0.1.0.1.11/extract-yaml-prose.mjs";

test("extracts directive and descriptive fields but skips examples and metadata", () => {
  const source = [
    'version: "13.0"',
    'description: "A short description."',
    "directives:",
    "  - id: E-0.1.0.0.0",
    "    dos:",
    '      - "Use clear words."',
    "    donts:",
    "      - Do not use jargon.",
    "    examples:",
    '      - "This example is hidden."',
    "custom:",
    "  - 13",
  ].join("\n");
  expect(extractYamlProse(source)).toEqual([
    { text: "A short description.", line: 2, kind: "prose" },
    { text: "Use clear words.", line: 6, kind: "directive" },
    { text: "Do not use jargon.", line: 8, kind: "directive" },
  ]);
});

test("skips invalid YAML because the specification check reports parse errors", () => {
  expect(extractYamlProse("description: [")).toEqual([]);
});
