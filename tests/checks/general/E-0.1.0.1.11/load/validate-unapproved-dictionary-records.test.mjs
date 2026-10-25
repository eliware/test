import { expect, test } from "@jest/globals";
import { validateUnapprovedDictionaryRecords } from "../../../../../src/checks/general/E-0.1.0.1.11/load/validate-unapproved-dictionary-records.mjs";

test("returns records after a valid word and alternatives header", () => {
  expect(
    validateUnapprovedDictionaryRecords([
      ["word", "alternative_1"],
      ["term", "USE"],
    ]),
  ).toEqual([["term", "USE"]]);
});

test("rejects an invalid dictionary header", () => {
  expect(() => validateUnapprovedDictionaryRecords([["wrong", "alternative_1"]])).toThrow(
    "invalid header",
  );
  expect(() => validateUnapprovedDictionaryRecords([["word"]])).toThrow("invalid header");
});

test("rejects empty words and records with too many columns", () => {
  expect(() =>
    validateUnapprovedDictionaryRecords([
      ["word", "alternative_1"],
      ["", "USE"],
    ]),
  ).toThrow("row 2 is invalid");
  expect(() =>
    validateUnapprovedDictionaryRecords([
      ["word", "alternative_1"],
      ["term", "USE", "MORE"],
    ]),
  ).toThrow("row 2 is invalid");
});
