import { expect, test } from "@jest/globals";
import { extractJsonProse } from "../../../../../src/checks/general/E-0.1.0.1.11/extract/json-prose.mjs";

test("extracts prose fields from nested objects and arrays", () => {
  expect(
    extractJsonProse(
      JSON.stringify({
        description: "A package description.",
        steps: ["First action.", "Second action."],
        nested: { prompt: "Choose a response." },
        scripts: { test: "npm test" },
        examples: ["Hidden sample."],
      }),
    ),
  ).toEqual([
    { text: "A package description.", line: 1, kind: "prose" },
    { text: "First action.", line: 1, kind: "prose" },
    { text: "Second action.", line: 1, kind: "prose" },
    { text: "Choose a response.", line: 1, kind: "prose" },
  ]);
});

test("skips invalid JSON and non-prose values", () => {
  expect(extractJsonProse("{")).toEqual([]);
  expect(extractJsonProse(JSON.stringify({ version: 13, name: "internal" }))).toEqual([]);
  expect(extractJsonProse(JSON.stringify("plain root text"))).toEqual([]);
});
