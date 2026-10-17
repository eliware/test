import { expect, test } from "@jest/globals";
import { parseUnapprovedCsv } from "../../../../../src/checks/general/E-0.1.0.1.11/load/parse-unapproved-csv.mjs";

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

test("rejects unclosed fields and parses the final record without a line break", () => {
  expect(() => parseUnapprovedCsv('"word","alternative_1"\n"term","missing')).toThrow(
    "unclosed quoted field",
  );
  expect(parseUnapprovedCsv('"word","alternative_1"\n"term","USE"')).toEqual([
    ["word", "alternative_1"],
    ["term", "USE"],
  ]);
});
