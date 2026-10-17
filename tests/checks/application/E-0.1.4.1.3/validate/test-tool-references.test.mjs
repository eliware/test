import { expect, test } from "@jest/globals";
import { validateTestToolReferences } from "../../../../../src/checks/application/E-0.1.4.1.3/validate/test-tool-references.mjs";

test("dispatches code and unknown files to the matching policy", () => {
  expect(validateTestToolReferences("src/run.mjs", 'import("vitest");')).toContain(
    "must not import or invoke a test runner",
  );
  expect(validateTestToolReferences("config.txt", "vitest run")).toBeNull();
});

test("dispatches package and YAML commands to their format validators", () => {
  expect(validateTestToolReferences("package.json", '{"scripts":{"test":"vitest run"}}')).toContain(
    "must not import or invoke a test runner",
  );
  expect(validateTestToolReferences("specs/policy.yaml", "run: vitest run")).toContain(
    "must not import or invoke a test runner",
  );
});

test("dispatches shell and Markdown files to command scanning", () => {
  expect(validateTestToolReferences("scripts/check.sh", "vitest run")).toContain(
    "must not import or invoke a test runner",
  );
  expect(validateTestToolReferences("README.md", "```bash\nnpx jest\n```")).toContain(
    "must not import or invoke a test runner",
  );
});

test("allows the supported Jest API and harness instrumentation", () => {
  expect(
    validateTestToolReferences("tests/run.test.mjs", 'import { test } from "@jest/globals";'),
  ).toBeNull();
  expect(validateTestToolReferences("src/run.mjs", 'import "istanbul-lib-instrument";', true)).toBe(
    null,
  );
  expect(validateTestToolReferences("scripts/run.sh", "jest --runInBand", true)).toBeNull();
  expect(validateTestToolReferences("scripts/run.sh", "jest --runInBand", false)).toContain(
    "must not import or invoke a test runner",
  );
});
