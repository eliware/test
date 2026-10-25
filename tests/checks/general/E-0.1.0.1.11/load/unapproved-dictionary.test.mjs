import { expect, test } from "@jest/globals";
import { loadUnapprovedDictionary } from "../../../../../src/checks/general/E-0.1.0.1.11/load/unapproved-dictionary.mjs";

test("loads the bundled CSV dictionary with alternatives for each word", () => {
  const dictionary = loadUnapprovedDictionary();
  expect(Object.keys(dictionary)).toHaveLength(1021);
  expect(dictionary.abandon).toBe("GO (v), STOP (v)");
  expect(dictionary).not.toHaveProperty("interference");
  for (const word of [
    "alter",
    "any",
    "attachment",
    "base",
    "case",
    "cross",
    "disposition",
    "drop",
    "escape",
    "except",
    "fix",
    "foreign",
    "get",
    "insert",
    "intersect",
    "join",
    "part",
    "port",
    "real",
  ])
    expect(dictionary).not.toHaveProperty(word);
});
