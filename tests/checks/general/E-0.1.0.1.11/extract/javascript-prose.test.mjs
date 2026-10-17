import { expect, test } from "@jest/globals";
import { expectedLicense } from "../../../../../src/checks/general/E-0.1.0.1.1/validate/required-package-files.mjs";
import { windowsProcessTreeFallbackScript } from "../../../../../src/validation/shared/process/run/windows-process-tree-fallback.mjs";
import { extractJavaScriptProse } from "../../../../../src/checks/general/E-0.1.0.1.11/extract/javascript-prose.mjs";

test("extracts comments, user-facing strings, templates, and JSX text", () => {
  const source = [
    "// Explain this behavior.",
    'const help = "Choose one option.";',
    'const token = "internal";',
    'const command = "npm install package";',
    "const output = `Validation failed for ${name}.`;",
    "const view = <p>Public words</p>;",
    "const label = <span>Label</span>;",
    "const tagged = String.raw`bad \\unicode ${name}`;",
    "const template = `single`;",
    "const oneWord = `single ${name}`;",
  ].join("\n");
  expect(extractJavaScriptProse(source)).toEqual([
    { text: " Explain this behavior.", line: 1, kind: "prose" },
    { text: "Choose one option.", line: 2, kind: "prose" },
    { text: "Validation failed for .", line: 5, kind: "prose" },
    { text: "Public words", line: 6, kind: "prose" },
    { text: "bad \\unicode ", line: 8, kind: "prose" },
  ]);
});

test("skips invalid source because lint reports parse errors", () => {
  expect(extractJavaScriptProse("const =")).toEqual([]);
});

test("combines template sections when interpolations have static string values", () => {
  const first = Array.from({ length: 13 }, (_, index) => `word${index + 1}`).join(" ");
  const second = Array.from({ length: 13 }, (_, index) => `word${index + 14}`).join(" ");
  expect(extractJavaScriptProse(`const text = \`${first} \${"${second}"}\`;`)).toContainEqual({
    text: `${first} ${second}`,
    line: 1,
    kind: "prose",
  });
  expect(
    extractJavaScriptProse(["const text = `before ${", "`middle words`", "} after`;"].join("")),
  ).toContainEqual({ text: "before middle words after", line: 1, kind: "prose" });
});

test("skips exact required license text and embedded PowerShell commands", () => {
  const source = [
    `const expectedLicense = ${JSON.stringify(expectedLicense)};`,
    `const windowsProcessTreeFallbackScript = ${JSON.stringify(windowsProcessTreeFallbackScript)};`,
  ].join("\n");
  expect(extractJavaScriptProse(source)).toEqual([]);
});

test("skips the exact approved PowerShell text when JavaScript concatenates it", () => {
  const split = Math.floor(windowsProcessTreeFallbackScript.length / 2);
  const source = `const windowsProcessTreeFallbackScript = ${JSON.stringify(
    windowsProcessTreeFallbackScript.slice(0, split),
  )} + ${JSON.stringify(windowsProcessTreeFallbackScript.slice(split))};`;
  expect(extractJavaScriptProse(source)).toEqual([]);
});

test("checks changed text in variables that use approved names", () => {
  const source = [
    'const expectedLicense = "A different license description.";',
    'const windowsProcessTreeFallbackScript = "A changed PowerShell command description.";',
  ].join("\n");
  expect(extractJavaScriptProse(source)).toEqual([
    { text: "A different license description.", line: 1, kind: "prose" },
    { text: "A changed PowerShell command description.", line: 2, kind: "prose" },
  ]);
});

test("checks prose after a matching variable without an initializer", () => {
  expect(
    extractJavaScriptProse('let expectedLicense; const note = "The value is missing.";'),
  ).toContainEqual({
    text: "The value is missing.",
    line: 1,
    kind: "prose",
  });
});

test("checks dynamic or non-concatenated values with approved variable names", () => {
  const source = [
    '{ let expectedLicense = "The first changed phrase" + value; }',
    '{ let expectedLicense = value + "The second changed phrase"; }',
    '{ let expectedLicense = "The third changed phrase" - "Another phrase"; }',
  ].join("\n");
  const texts = extractJavaScriptProse(source).map(({ text }) => text);
  expect(texts).toContain("The first changed phrase");
  expect(texts).toContain("The second changed phrase");
  expect(texts).toContain("The third changed phrase");
  expect(texts).toContain("Another phrase");
});

test("checks unrelated prose that contains the PowerShell command name", () => {
  expect(
    extractJavaScriptProse('const note = "Get-CimInstance checks each process record.";'),
  ).toContainEqual({
    text: "Get-CimInstance checks each process record.",
    line: 1,
    kind: "prose",
  });
});
