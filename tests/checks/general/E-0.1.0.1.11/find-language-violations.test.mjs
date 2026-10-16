import { expect, test } from "@jest/globals";
import { findLanguageViolations } from "../../../../src/checks/general/E-0.1.0.1.11/find-language-violations.mjs";

const dictionary = { abrupt: "SUDDEN (adj)", "close to": "NEAR (prep)", "": "invalid" };

function expectedLanguageFinding(path, line, word, alternatives) {
  return `${path}:${line} uses "${word}". Suggested alternatives: ${alternatives}.`;
}

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
    "specs/directives.yaml:4 directive has 25 words. Limit: 20.",
    "specs/directives.yaml:4 directive uses a semicolon.",
    expectedLanguageFinding("specs/directives.yaml", 4, "abrupt", "SUDDEN (adj)"),
    expectedLanguageFinding("specs/directives.yaml", 4, "close to", "NEAR (prep)"),
    "specs/directives.yaml:8 sentence 1 has 26 words. Limit: 25.",
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
    "README.md:1 paragraph has 7 sentences. Limit: 6.",
    expectedLanguageFinding("README.md", 3, "Abrupt", "SUDDEN (adj)"),
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

test("reports a banned word when no alternatives are listed", () => {
  expect(
    findLanguageViolations(
      "README.md",
      [{ text: "Act now.", line: 1, kind: "prose" }],
      { act: "" },
      new Set(),
    ),
  ).toEqual([expectedLanguageFinding("README.md", 1, "Act", "none listed")]);
});

test("does not match dictionary words inside hyphenated compounds", () => {
  expect(
    findLanguageViolations(
      "README.md",
      [
        {
          text: "Use an http-request on a tcp-port with a switch-interface.",
          line: 1,
          kind: "prose",
        },
      ],
      { request: "HTTP MESSAGE (n)", port: "TCP, UDP", switch: "SET (v)" },
      new Set(),
    ),
  ).toEqual([]);
});
