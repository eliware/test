import { expect, test } from "@jest/globals";
import { validateCoverageFileEvidence } from "../../../../../../src/checks/general/E-1/E-1.20/E-1.20.10/validate-coverage-file-evidence.mjs";

test("accepts empty or complete matching evidence", () => {
  expect(validateCoverageFileEvidence("empty.mjs", {})).toBeUndefined();
  expect(validateCoverageFileEvidence("complete.mjs", {
    statementMap: { 1: {} }, s: { 1: 1 }, branchMap: { 1: {} }, b: { 1: [] },
    fnMap: { 1: {} }, f: { 1: 1 }, lineMap: { 1: {} }, l: { 1: 1 },
  })).toBeUndefined();
});

test("rejects one-sided evidence, absent required pairs, and missing counters", () => {
  expect(() => validateCoverageFileEvidence("map-only.mjs", { statementMap: { 1: {} } })).toThrow("incomplete");
  expect(() => validateCoverageFileEvidence("counter-only.mjs", { s: { 1: 1 } })).toThrow("incomplete");
  expect(() => validateCoverageFileEvidence("missing-map.mjs", { s: {} })).toThrow("incomplete");
  expect(() => validateCoverageFileEvidence("missing-counter.mjs", { statementMap: {} })).toThrow("incomplete");
  expect(() => validateCoverageFileEvidence("empty-counter-map.mjs", { statementMap: { 1: {} }, s: {} })).toThrow("incomplete");
});

test("rejects mismatched map keys and malformed counters", () => {
  expect(() => validateCoverageFileEvidence("key-count.mjs", { statementMap: { 1: {}, 2: {} }, s: { 1: 1 } })).toThrow("keys do not match");
  expect(() => validateCoverageFileEvidence("key-identity.mjs", { statementMap: { 1: {} }, s: { 2: 1 } })).toThrow("keys do not match");
  expect(() => validateCoverageFileEvidence("invalid.mjs", { statementMap: { 1: {} }, s: { 1: Number.NaN } })).toThrow("malformed");
});
