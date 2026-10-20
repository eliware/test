import { expect, test } from "@jest/globals";
import { validateApplicationTestTools } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/metadata/test-tools.mjs";

test("rejects alternative runners and coverage engines", () => {
  const errors = validateApplicationTestTools({
    name: "app",
    devDependencies: { vitest: "2", "@vitest/coverage-v8": "2" },
  });
  expect(errors).toContain(
    "Do not declare separate test or coverage tools: vitest, @vitest/coverage-v8.",
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

test.each([
  "@playwright/test",
  "@vitest/coverage-v8",
  "@vitest/runner",
  "@tapjs/run",
  "custom-test: npm:mocha@10",
  "custom-cypress: npm:cypress@13",
])("rejects alternative tools declared as %s", (dependency) => {
  const [name, version] = dependency.includes(":") ? dependency.split(": ") : [dependency, "1"];
  expect(validateApplicationTestTools({ devDependencies: { [name]: version } })).toContain(
    `Do not declare separate test or coverage tools: ${name}.`,
  );
});

test("allows the harness test dependencies", () => {
  expect(
    validateApplicationTestTools({
      name: "@eliware/test",
      dependencies: { "@jest/globals": "30", jest: "30", "istanbul-lib-instrument": "6" },
    }),
  ).toEqual([]);
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
