import { expect, test } from "@jest/globals";
import { extractJavaScriptProse } from "../../../../src/checks/general/E-0.1.0.1.11/extract-javascript-prose.mjs";

test("extracts comments, user-facing strings, templates, and JSX text", () => {
  const source = [
    "// Explain this behavior.",
    'const help = "Choose one option.";',
    'const token = "internal";',
    'const command = "npm install package";',
    "const output = `Validation failed for ${name}.`;",
    "const view = <p>Public words</p>;",
    "const label = <span>Label</span>;",
    "const tagged = String.raw`bad \\unicode`;",
    "const template = `single`;",
  ].join("\n");
  expect(extractJavaScriptProse(source)).toEqual([
    { text: " Explain this behavior.", line: 1, kind: "prose" },
    { text: "Choose one option.", line: 2, kind: "prose" },
    { text: "Validation failed for .", line: 5, kind: "prose" },
    { text: "Public words", line: 6, kind: "prose" },
    { text: "bad \\unicode", line: 8, kind: "prose" },
  ]);
});

test("skips invalid source because lint reports parse errors", () => {
  expect(extractJavaScriptProse("const =")).toEqual([]);
});
