import { expect, test } from "@jest/globals";
import { validateApplicationTestTools } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/metadata/test-tools.mjs";

test("rejects alternative runners and coverage engines", () => {
  const errors = validateApplicationTestTools({
    name: "app",
    devDependencies: { vitest: "2", "@vitest/coverage-v8": "2" },
    testRunner: "other",
  });
  expect(errors).toContain(
    "Do not declare separate test or coverage tools: vitest, @vitest/coverage-v8.",
  );
  expect(errors).toContain(
    "package.json must not configure a separate test runner or coverage engine.",
  );
  expect(validateApplicationTestTools({ devDependencies: { "@jest/globals": "30" } })).toContain(
    "Do not declare separate test or coverage tools: @jest/globals.",
  );
  expect(
    validateApplicationTestTools({
      name: "consumer",
      devDependencies: { jest: "30", "istanbul-lib-instrument": "6" },
    }),
  ).toContain("Do not declare separate test or coverage tools: jest, istanbul-lib-instrument.");
});

test("accepts package metadata without optional scripts or runner fields", () => {
  expect(validateApplicationTestTools({})).toEqual([]);
  expect(validateApplicationTestTools()).toEqual([]);
  expect(
    validateApplicationTestTools({
      dependencies: { regular: 1, versioned: "1.0.0" },
      scripts: { regular: 1 },
    }),
  ).toEqual([]);
});
