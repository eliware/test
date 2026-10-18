import { expect, test } from "@jest/globals";
import { findDictionaryViolations } from "../../../../../src/checks/general/E-0.1.0.1.11/find/dictionary-violations.mjs";

test("reports matching words and phrases with their alternatives", () => {
  expect(
    findDictionaryViolations(
      "README.md",
      { text: "An Abrupt change is close to the target.", line: 3 },
      { abrupt: "SUDDEN (adj)", "close to": "NEAR (prep)" },
    ),
  ).toEqual([
    'README.md:3 uses "Abrupt". Suggested alternatives: SUDDEN (adj).',
    'README.md:3 uses "close to". Suggested alternatives: NEAR (prep).',
  ]);
});

test("handles empty alternatives and ignores invalid dictionary keys", () => {
  expect(
    findDictionaryViolations("README.md", { text: "Act now.", line: 1 }, { "": "bad", act: "" }),
  ).toEqual(['README.md:1 uses "Act". Suggested alternatives: none listed.']);
});

test("does not match a phrase when its later token differs", () => {
  expect(
    findDictionaryViolations(
      "README.md",
      { text: "Close enough.", line: 1 },
      { "close to": "NEAR (prep)" },
    ),
  ).toEqual([]);
});

test("keeps dictionary order for overlapping matches", () => {
  expect(
    findDictionaryViolations(
      "README.md",
      { text: "Close to the edge.", line: 1 },
      { "close to": "NEAR (prep)", close: "NEARBY (adj)" },
    ),
  ).toEqual([
    'README.md:1 uses "Close to". Suggested alternatives: NEAR (prep).',
    'README.md:1 uses "Close". Suggested alternatives: NEARBY (adj).',
  ]);
});
