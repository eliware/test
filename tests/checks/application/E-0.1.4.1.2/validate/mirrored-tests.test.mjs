import { expect, test } from "@jest/globals";
import { validateMirroredTests } from "../../../../../src/checks/application/E-0.1.4.1.2/validate/mirrored-tests.mjs";

test("accepts a source file with its matching test file", () => {
  const files = ["src/a.mjs", "tests/a.test.mjs"];
  expect(validateMirroredTests(files)).toEqual([]);
});

test("reports missing, unmatched, and support test files", () => {
  const files = ["src/a.mjs", "tests/b.test.mjs", "tests/support.mjs"];
  const errors = validateMirroredTests(files);
  expect(errors.join("\n")).toContain("tests/a.test.mjs is required");
  expect(errors.join("\n")).toContain("tests/support.mjs is not a mirrored");
  expect(errors.join("\n")).toContain("tests/b.test.mjs has no matching source");
});

test("reports a required mirrored test for an implementation source", () => {
  expect(validateMirroredTests(["src/app.mjs"])).toEqual([
    "tests/app.test.mjs is required for its source.",
  ]);
});
