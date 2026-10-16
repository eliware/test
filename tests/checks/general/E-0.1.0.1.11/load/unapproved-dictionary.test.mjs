import { expect, test } from "@jest/globals";
import {
  loadUnapprovedDictionary,
  parseUnapprovedCsv,
} from "../../../../../src/checks/general/E-0.1.0.1.11/load/unapproved-dictionary.mjs";

test("loads the bundled CSV dictionary with alternatives for each word", () => {
  const dictionary = loadUnapprovedDictionary();
  expect(Object.keys(dictionary)).toHaveLength(1045);
  expect(dictionary.abandon).toBe("GO (v), STOP (v)");
});

test("parses quoted fields, commas, escaped quotes, and line breaks", () => {
  expect(
    parseUnapprovedCsv(
      '"word","alternative_1","alternative_2"\r\n"term","USE, THEN","SAY ""yes""\nnow"\r\n',
    ),
  ).toEqual([
    ["word", "alternative_1", "alternative_2"],
    ["term", "USE, THEN", 'SAY "yes"\nnow'],
  ]);
});

test("rejects an unclosed quoted field", () => {
  expect(() => parseUnapprovedCsv('"word","alternative_1"\n"term","missing')).toThrow(
    "unclosed quoted field",
  );
});

test("parses a final CSV record without a line break", () => {
  expect(parseUnapprovedCsv('"word","alternative_1"\n"term","USE"')).toEqual([
    ["word", "alternative_1"],
    ["term", "USE"],
  ]);
});

test("rejects invalid headers and records", () => {
  expect(() => loadUnapprovedDictionary('"wrong","alternative_1"\n')).toThrow("invalid header");
  expect(() => loadUnapprovedDictionary('"word"\n')).toThrow("invalid header");
  expect(() => loadUnapprovedDictionary('"word","alternative_1"\n"","USE"\n')).toThrow(
    "row 2 is invalid",
  );
  expect(() => loadUnapprovedDictionary('"word","alternative_1"\n"term","USE","MORE"\n')).toThrow(
    "row 2 is invalid",
  );
});
