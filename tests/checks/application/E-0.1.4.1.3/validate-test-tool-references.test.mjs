import { expect, test } from "@jest/globals";
import { validateTestToolReferences } from "../../../../src/checks/application/E-0.1.4.1.3/validate-test-tool-references.mjs";

test("detects runner references in source and package files", () => {
  expect(validateTestToolReferences("src/run.mjs", 'import("vitest");')).toBe(
    "src/run.mjs must not import or invoke a test runner or coverage tool.",
  );
  expect(validateTestToolReferences("package.json", '{"scripts":{"test":"vitest run"}}')).toBe(
    "package.json must not import or invoke a test runner or coverage tool.",
  );
});

test("allows the supported Jest API and harness instrumentation", () => {
  expect(
    validateTestToolReferences("tests/run.test.mjs", 'import { test } from "@jest/globals";'),
  ).toBeNull();
  expect(
    validateTestToolReferences("src/run.mjs", 'import "istanbul-lib-instrument";', true),
  ).toBeNull();
});

test("uses separate text rules for consumer and harness manifests", () => {
  expect(validateTestToolReferences("package.json", '"vitest"')).toContain(
    "package.json must not import or invoke a test runner or coverage tool.",
  );
  expect(validateTestToolReferences("package.json", '"vitest run"', true)).toContain(
    "package.json must not import or invoke a test runner or coverage tool.",
  );
  expect(validateTestToolReferences("specs/policy.yaml", '"vitest"')).toContain(
    "specs/policy.yaml must not import or invoke a test runner or coverage tool.",
  );
  expect(
    validateTestToolReferences("package.json", '{"scripts":{"test":"eliware-test"}}'),
  ).toBeNull();
});
