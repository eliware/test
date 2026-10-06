import { expect, test } from "@jest/globals";
import { validateApplicationTestTools } from "../../../../src/checks/application/E-0.1.4.1.3/validate-application-test-tools.mjs";

test("accepts the harness tools and rejects alternative runners and coverage engines", () => {
  expect(
    validateApplicationTestTools({
      name: "@eliware/test",
      dependencies: { jest: "30", "istanbul-lib-instrument": "6" },
    }),
  ).toEqual([]);
  const errors = validateApplicationTestTools({
    name: "app",
    devDependencies: { vitest: "2", "@vitest/coverage-v8": "2" },
    scripts: { extra: "node --experimental-test-coverage --test" },
    testRunner: "other",
  });
  expect(errors).toContain(
    "Do not declare separate test or coverage tools: vitest, @vitest/coverage-v8.",
  );
  expect(errors).toContain(
    "package.json script extra must not invoke a separate test or coverage tool.",
  );
  expect(errors).toContain(
    "package.json must not configure a separate test runner or coverage engine.",
  );
});

test("accepts package metadata without optional scripts or runner fields", () => {
  expect(validateApplicationTestTools({})).toEqual([]);
  expect(validateApplicationTestTools()).toEqual([]);
});
