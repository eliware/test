import { expect, test } from "@jest/globals";
import { findMirrorViolations } from "../../../../src/checks/general/E-1/find-source-test-mirror-violations.mjs";

test("accepts an exact source and directory mirror", () => {
  expect(findMirrorViolations(["a.mjs"], ["a.test.mjs"], ["nested"], ["nested"])).toEqual([]);
  expect(findMirrorViolations(["a.mjs"], ["a.test.mjs"])).toEqual([]);
});

test("reports missing and orphan files, directories, and invalid extensions", () => {
  const findings = findMirrorViolations(["missing.mjs", "bad.js", "notes.txt"], ["orphan.test.mjs", "bad.js"], ["source-only"], ["test-only"]);
  expect(findings).toEqual([
    expect.stringContaining("counts differ"),
    expect.stringContaining("missing mirrored tests"),
    expect.stringContaining("orphan tests"),
    expect.stringContaining("missing mirrored directories"),
    expect.stringContaining("orphan test directories"),
    expect.stringContaining("invalid test paths"),
    expect.stringContaining("invalid source paths"),
  ]);
});

test("detects file and directory count mismatches independently", () => {
  expect(findMirrorViolations(["a.mjs"], [], [], [])).toEqual([
    expect.stringContaining("counts differ"), expect.stringContaining("missing mirrored tests"),
  ]);
  expect(findMirrorViolations([], [], ["nested"], [])).toEqual([
    expect.stringContaining("counts differ"), expect.stringContaining("missing mirrored directories"),
  ]);
});
