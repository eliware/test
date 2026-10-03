import { expect, test } from "@jest/globals";
import { findMirrorViolations } from "../../../../src/checks/general/E-0.1/find-source-test-mirror-violations.mjs";

test("accepts an exact source and directory mirror", () => {
  expect(findMirrorViolations(["a.mjs"], ["a.test.mjs"], ["nested"], ["nested"])).toEqual([]);
  expect(findMirrorViolations(["a.mjs"], ["a.test.mjs"])).toEqual([]);
});

test("pairs library declarations with their adjacent implementation module", () => {
  expect(
    findMirrorViolations(["index.mjs", "index.d.ts"], ["index.test.mjs"], [], [], {
      allowTypeDeclarations: true,
    }),
  ).toEqual([]);
});

test("rejects library declarations without an adjacent matching implementation module", () => {
  expect(findMirrorViolations(["index.d.ts"], [], [], [], { allowTypeDeclarations: true })).toEqual(
    expect.arrayContaining([expect.stringContaining("unpaired TypeScript declarations")]),
  );
});

test("rejects type declarations outside the library mirror exception", () => {
  expect(findMirrorViolations(["index.mjs", "index.d.ts"], ["index.test.mjs"])).toEqual(
    expect.arrayContaining([expect.stringContaining("invalid source paths")]),
  );
});

test("reports missing and orphan files, directories, and invalid extensions", () => {
  const findings = findMirrorViolations(
    ["missing.mjs", "bad.js", "notes.txt"],
    ["orphan.test.mjs", "bad.js"],
    ["source-only"],
    ["test-only"],
  );
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
    expect.stringContaining("counts differ"),
    expect.stringContaining("missing mirrored tests"),
  ]);
  expect(findMirrorViolations([], [], ["nested"], [])).toEqual([
    expect.stringContaining("counts differ"),
    expect.stringContaining("missing mirrored directories"),
  ]);
});
