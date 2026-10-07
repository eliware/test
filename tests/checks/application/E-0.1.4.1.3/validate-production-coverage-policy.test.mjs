import { expect, test } from "@jest/globals";
import { validateProductionCoveragePolicy } from "../../../../src/checks/application/E-0.1.4.1.3/validate-production-coverage-policy.mjs";

test("rejects coverage exclusions in production source", () => {
  expect(validateProductionCoveragePolicy("src/run.mjs", "/* c8 ignore next */")).toBe(
    "src/run.mjs must not exclude production coverage.",
  );
});

test("allows coverage directives outside production source", () => {
  expect(validateProductionCoveragePolicy("tests/run.test.mjs", "/* c8 ignore next */")).toBeNull();
});
