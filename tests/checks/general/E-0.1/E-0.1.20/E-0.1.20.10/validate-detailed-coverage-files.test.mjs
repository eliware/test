import { expect, test } from "@jest/globals";
import { validateDetailedCoverageFiles } from "../../../../../../src/checks/general/E-0.1/E-0.1.20/E-0.1.20.10/validate-detailed-coverage-files.mjs";

const complete = { s: {}, b: {}, f: {}, statementMap: {}, branchMap: {}, fnMap: {} };

test("filters non-source reports and requires inventory for in-scope files", () => {
  expect(() => validateDetailedCoverageFiles({ "src/example.mjs": complete })).toThrow(
    "non-repository source file: src/example.mjs",
  );
  expect(validateDetailedCoverageFiles({ "tests/example.test.mjs": {}, "README.md": {} })).toEqual(
    [],
  );
  expect(validateDetailedCoverageFiles(null)).toEqual([]);
});

test("requires every in-scope repository source file to be reported", () => {
  expect(() => validateDetailedCoverageFiles({}, ["src/missing.mjs"])).toThrow(
    "Detailed coverage omits in-scope source file(s): src/missing.mjs.",
  );
  expect(validateDetailedCoverageFiles({}, ["tests/example.test.mjs"])).toEqual([]);
});

test("rejects unlisted source files and missing source-derived shapes", () => {
  expect(() =>
    validateDetailedCoverageFiles(
      { "src/listed.mjs": complete, "src/unlisted.mjs": complete },
      ["src/listed.mjs"],
      { "src/listed.mjs": {} },
    ),
  ).toThrow("non-repository source file: src/unlisted.mjs");
  expect(() =>
    validateDetailedCoverageFiles({ "src/listed.mjs": complete }, ["src/listed.mjs"]),
  ).toThrow("no source-derived shape for src/listed.mjs");
});

test("requires each detailed source entry to provide all coverage maps", () => {
  expect(() => validateDetailedCoverageFiles({ "src/incomplete.mjs": { s: {} } })).toThrow(
    "Coverage evidence is incomplete for src/incomplete.mjs.",
  );
  expect(() => validateDetailedCoverageFiles({ "src/null.mjs": null })).toThrow(
    "Coverage evidence is incomplete for src/null.mjs.",
  );
});

test("matches normalized Windows paths against repository files", () => {
  const entries = [["C:\\repo\\src\\listed.mjs", complete]];
  expect(
    validateDetailedCoverageFiles(Object.fromEntries(entries), ["src/listed.mjs"], {
      "src/listed.mjs": {},
    }),
  ).toEqual(entries);
});
