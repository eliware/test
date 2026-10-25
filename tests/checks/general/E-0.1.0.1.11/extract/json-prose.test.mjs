import { expect, test } from "@jest/globals";
import { extractJsonProse } from "../../../../../src/checks/general/E-0.1.0.1.11/extract/json-prose.mjs";

test("extracts every documented prose field from nested objects and arrays", () => {
  const fields = [
    "description",
    "title",
    "purpose",
    "owner",
    "boundaries",
    "prerequisites",
    "steps",
    "prompt",
    "message",
    "help",
    "summary",
    "note",
    "notes",
    "content",
  ];
  const nested = Object.fromEntries(fields.map((field) => [field, `${field} text.`]));
  nested.steps = ["First action.", "Second action."];
  nested.TITLE = "Uppercase field.";
  nested.examples = { description: "Nested record text." };
  nested.runner = "Inert value.";
  const result = extractJsonProse(
    JSON.stringify({ nested, examples: { description: "Hidden sample." } }),
  );
  expect(result.map(({ text }) => text)).toEqual([
    "description text.",
    "title text.",
    "purpose text.",
    "owner text.",
    "boundaries text.",
    "prerequisites text.",
    "First action.",
    "Second action.",
    "prompt text.",
    "message text.",
    "help text.",
    "summary text.",
    "note text.",
    "notes text.",
    "content text.",
    "Uppercase field.",
    "Nested record text.",
  ]);
  expect(result.every((block) => block.line === 1 && block.kind === "prose")).toBe(true);
});

test("skips invalid JSON and non-prose values", () => {
  expect(extractJsonProse("{")).toEqual([]);
  expect(extractJsonProse(JSON.stringify({ version: 13, name: "internal" }))).toEqual([]);
  expect(extractJsonProse(JSON.stringify("plain root text"))).toEqual([]);
});
