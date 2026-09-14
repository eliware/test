import { expect, test } from "@jest/globals";
import { findDuplicatePathViolations, findMirrorViolations, findOrphanTestViolations, findTestContractViolations } from "../../../../src/checks/general/E-1/validate-mirror-structure.mjs";

test("reports mirror, suffix, and source-language violations", () => {
  expect(findMirrorViolations(["a.mjs", "bad.js"], ["orphan.test.mjs", "bad.js"])).toEqual([
    expect.stringContaining("missing mirrored tests"),
    expect.stringContaining("orphan tests"),
    expect.stringContaining("invalid test paths"),
    expect.stringContaining("invalid source paths"),
  ]);
});

test("reports directory mismatches and accepts an exact mirror", () => {
  expect(findMirrorViolations(["a.mjs"], ["a.test.mjs"], ["nested"], [])).toEqual([
    expect.stringContaining("counts differ"),
    expect.stringContaining("missing mirrored directories"),
  ]);
  expect(findMirrorViolations(["a.mjs"], ["a.test.mjs"], [], ["nested"])).toEqual([
    expect.stringContaining("counts differ"),
    expect.stringContaining("orphan test directories"),
  ]);
  expect(findMirrorViolations(["a.mjs"], ["a.test.mjs"], ["nested"], ["nested"])).toEqual([]);
});

test("rejects duplicate aliases, non-Jest mirrors, and source-less non-cross-cutting tests", () => {
  expect(findDuplicatePathViolations(["A.mjs", "a.mjs"], ["A.test.mjs", "a.test.mjs"])).toHaveLength(2);
  expect(findOrphanTestViolations(["orphan.test.mjs", "api.integration.test.mjs"], new Set(["a.test.mjs"]))).toEqual(["orphan.test.mjs"]);
  expect(findTestContractViolations(["a.mjs"], new Map([["a.test.mjs", "test(\"a\", () => {});"]])).join(";")).toContain("does not reference");
  expect(findTestContractViolations(["a.mjs"], new Map([["a.test.mjs", "import thing from './a.mjs';"]])).join(";")).toContain("not a Jest test");
  expect(findTestContractViolations(["b.mjs"], new Map())).toHaveLength(2);
});
