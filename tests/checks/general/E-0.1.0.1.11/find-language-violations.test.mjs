import { expect, test } from "@jest/globals";
import { findLanguageViolations } from "../../../../src/checks/general/E-0.1.0.1.11/find-language-violations.mjs";

const dictionary = { abrupt: ["SUDDEN (adj)"], "close to": ["NEAR (prep)"], "": ["invalid"] };

test("reports directive limits, semicolons, and dictionary alternatives", () => {
  const longInstruction = Array(21).fill("safe").join(" ");
  const errors = findLanguageViolations(
    "specs/directives.yaml",
    [
      { text: `${longInstruction}; abrupt near close to.`, line: 4, kind: "directive" },
      { text: Array(26).fill("safe").join(" "), line: 8, kind: "prose" },
    ],
    dictionary,
    new Set(),
  );
  expect(errors).toEqual([
    "specs/directives.yaml:4 directive has 25 words; limit is 20.",
    "specs/directives.yaml:4 directive uses a semicolon.",
    'specs/directives.yaml:4 uses "abrupt"; approved alternatives: SUDDEN (adj).',
    'specs/directives.yaml:4 uses "close to"; approved alternatives: NEAR (prep).',
    "specs/directives.yaml:8 sentence 1 has 26 words; limit is 25.",
  ]);
});

test("reports paragraph limits and matches whole words without matching longer words", () => {
  const paragraph = Array(7).fill("Short sentence.").join(" ");
  expect(
    findLanguageViolations(
      "README.md",
      [
        { text: paragraph, line: 1, kind: "paragraph" },
        { text: "Abruptness is longer.", line: 2, kind: "prose" },
        { text: "An Abrupt change.", line: 3, kind: "prose" },
        { text: "Close enough.", line: 4, kind: "prose" },
        { text: "A safe sentence; with a semicolon.", line: 5, kind: "prose" },
      ],
      dictionary,
      new Set(),
    ),
  ).toEqual([
    "README.md:1 paragraph has 7 sentences; limit is 6.",
    'README.md:3 uses "Abrupt"; approved alternatives: SUDDEN (adj).',
    "README.md:5 sentence 1 uses a semicolon.",
  ]);
});

test("skips exact examples and accepts text within each limit", () => {
  expect(
    findLanguageViolations(
      "README.md",
      [
        { text: "The exact required words.", line: 1, kind: "prose" },
        { text: "unlistedterm.", line: 2, kind: "prose" },
        { text: "unlistedterm.", line: 3, kind: "directive" },
        { text: "A direct instruction.", line: 4, kind: "directive" },
      ],
      dictionary,
      new Set(["the exact required words", "a direct instruction"]),
    ),
  ).toEqual([]);
});
