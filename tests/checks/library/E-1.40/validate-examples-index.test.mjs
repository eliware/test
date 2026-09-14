import { validateExamplesIndex } from "../../../../src/checks/library/E-1.40/validate-examples-index.mjs";

test("requires the runnable example index contract", () => {
  expect(validateExamplesIndex("Purpose\nPrerequisites\nCommand\nExpected result")).toBeNull();
  expect(validateExamplesIndex("Purpose\nCommand")).toContain("prerequisites");
});

test("requires every named example to be linked", () => {
  expect(validateExamplesIndex("Purpose\nPrerequisites\nCommand\nExpected result", ["basic.mjs"])).toContain("basic.mjs");
  expect(validateExamplesIndex("Purpose\nPrerequisites\nCommand\nExpected result\n[basic.mjs](basic.mjs)", ["basic.mjs"])).toBeNull();
});
