import { expect, test } from "@jest/globals";
import { findMirrorViolations } from "../../../../src/checks/general/E-1/validate-mirror-structure.mjs";

test("reports mirror, suffix, and source-language violations", () => {
  expect(findMirrorViolations(["a.mjs", "bad.js"], ["orphan.test.mjs", "bad.js"])).toEqual([
    expect.stringContaining("missing mirrored tests"),
    expect.stringContaining("orphan tests"),
    expect.stringContaining("invalid test paths"),
    expect.stringContaining("invalid source paths"),
  ]);
});
