import { expect, test } from "@jest/globals";
import { validateProductionCoveragePolicy } from "../../../../src/checks/application/E-0.1.4.1.3/validate-production-coverage-policy.mjs";

test("rejects coverage exclusions in production source", () => {
  expect(validateProductionCoveragePolicy("src/run.mjs", "/* c8 ignore next */")).toBe(
    "src/run.mjs must not exclude production coverage.",
  );
});

test("allows coverage directives outside production source", () => {
  expect(validateProductionCoveragePolicy("tests/run.test.mjs", "/* c8 ignore next */")).toBeNull();
  expect(validateProductionCoveragePolicy("src/run.ts", "/* c8 ignore next */")).toBeNull();
});

test("allows Istanbul directives only for a library primary export barrel", () => {
  const path = "src/index.mjs";
  const content = '/* istanbul ignore file */\nexport { value } from "./value.mjs";';
  expect(
    validateProductionCoveragePolicy(path, content, {
      allowLibraryBarrel: true,
      pureExportBarrel: true,
    }),
  ).toBeNull();
  expect(
    validateProductionCoveragePolicy(path, "/* c8 ignore file */", {
      allowLibraryBarrel: true,
      pureExportBarrel: true,
    }),
  ).toContain("must not exclude");
  expect(
    validateProductionCoveragePolicy(path, "/* istanbul ignore file */", {
      allowLibraryBarrel: true,
      pureExportBarrel: false,
    }),
  ).toContain("must not exclude");
});
