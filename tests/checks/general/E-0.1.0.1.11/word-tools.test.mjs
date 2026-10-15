import { expect, test } from "@jest/globals";
import {
  countWords,
  normalizeSentence,
  splitSentences,
  tokenizeWords,
} from "../../../../src/checks/general/E-0.1.0.1.11/word-tools.mjs";

test("counts hyphenated terms as one word and returns source offsets", () => {
  expect(countWords("Use a case-by-case review.")).toBe(4);
  expect(tokenizeWords("Use a case-by-case review.")).toEqual([
    { word: "Use", index: 0 },
    { word: "a", index: 4 },
    { word: "case-by-case", index: 6 },
    { word: "review", index: 19 },
  ]);
});

test("splits sentences at terminal punctuation and keeps decimal points", () => {
  expect(splitSentences("One. Two? Three!")).toEqual(["One.", "Two?", "Three!"]);
  expect(splitSentences("Version 13.0 works.")).toEqual(["Version 13.0 works."]);
  expect(splitSentences("A word.next")).toEqual(["A word.next"]);
  expect(splitSentences("What?!” Next.")).toEqual(["What?!”", "Next."]);
  expect(splitSentences("A final fragment")).toEqual(["A final fragment"]);
  expect(splitSentences("")).toEqual([]);
});

test("normalizes case and punctuation for exact sentence comparison", () => {
  expect(normalizeSentence("Keep THIS sentence.")).toBe("keep this sentence");
});
