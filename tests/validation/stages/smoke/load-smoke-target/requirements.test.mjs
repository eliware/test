import { expect, test } from "@jest/globals";
import {
  hasPackageDependency,
  validateSmokeTargetRequirements,
} from "../../../../../src/validation/stages/smoke/load-smoke-target/requirements.mjs";

test.each(["dependencies", "devDependencies", "optionalDependencies"])(
  "finds dependencies in %s",
  (field) => {
    expect(hasPackageDependency({ [field]: { "@eliware/test": "15.0.0" } }, "@eliware/test")).toBe(
      true,
    );
  },
);

test("requires a distinct consumer, test script, and package dependency", () => {
  expect(validateSmokeTargetRequirements({ name: "@eliware/test" }, "@eliware/test")).toContain(
    "source package repository",
  );
  expect(validateSmokeTargetRequirements({}, "@eliware/test")).toContain("npm test script");
  expect(validateSmokeTargetRequirements({ scripts: { test: "jest" } }, "@eliware/test")).toContain(
    "package.json dependencies",
  );
  expect(
    validateSmokeTargetRequirements(
      { scripts: { test: "jest" }, dependencies: { "@eliware/test": "15.0.0" } },
      "@eliware/test",
    ),
  ).toBeNull();
});
