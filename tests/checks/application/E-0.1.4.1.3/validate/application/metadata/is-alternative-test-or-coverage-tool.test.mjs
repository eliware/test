import { expect, test } from "@jest/globals";
import { isAlternativeTestOrCoverageTool } from "../../../../../../../src/checks/application/E-0.1.4.1.3/validate/application/metadata/is-alternative-test-or-coverage-tool.mjs";

test("recognizes runner and coverage package names", () => {
  for (const name of [
    "jest",
    "jest-cli",
    "@jest/core",
    "babel-jest",
    "istanbul",
    "babel-plugin-istanbul",
    "istanbul-lib-instrument",
    "@istanbuljs/nyc-config",
    "ava",
    "jasmine-core",
    "@playwright/test",
    "@vitest/coverage-v8",
  ])
    expect(isAlternativeTestOrCoverageTool(name)).toBe(true);
});

test("recognizes npm aliases and rejects unrelated packages", () => {
  expect(isAlternativeTestOrCoverageTool("custom", "npm:vitest@2")).toBe(true);
  expect(isAlternativeTestOrCoverageTool("custom", "npm:@jest/core@30")).toBe(true);
  expect(isAlternativeTestOrCoverageTool("custom", "npm:ordinary-package@1")).toBe(false);
  expect(isAlternativeTestOrCoverageTool("ordinary-package", 1)).toBe(false);
});
