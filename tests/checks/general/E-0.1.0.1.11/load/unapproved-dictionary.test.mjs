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
