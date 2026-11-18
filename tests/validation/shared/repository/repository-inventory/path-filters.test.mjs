import { expect, test } from "@jest/globals";
import isIgnoredRepositoryPath from "../../../../../src/validation/shared/repository/repository-inventory/path-filters/is/ignored-repository-path.mjs";
import isGeneratedRepositoryPath from "../../../../../src/validation/shared/repository/repository-inventory/path-filters/is/generated-repository-path.mjs";
import isRepositoryFixturePath from "../../../../../src/validation/shared/repository/repository-inventory/path-filters/is/repository-fixture-path.mjs";
import isRepositoryIgnoredPath from "../../../../../src/validation/shared/repository/repository-inventory/path-filters.mjs";
test("classifies ignored, generated, and fixture repository paths", () => {
  expect(isRepositoryIgnoredPath("test-results/report.md")).toBe(true);
  expect(isRepositoryIgnoredPath("nested/artifacts/report.md")).toBe(true);
  expect(isIgnoredRepositoryPath("nested/local/report.mjs", new Set(["nested/local"]))).toBe(true);
  expect(isIgnoredRepositoryPath("artifacts/report.mjs")).toBe(true);
  expect(isRepositoryIgnoredPath("tests/report.md")).toBe(false);
  expect(isGeneratedRepositoryPath("dist/bundle.mjs")).toBe(true);
  expect(isGeneratedRepositoryPath("src/index.mjs")).toBe(false);
  expect(isRepositoryFixturePath("src/test-fixtures/example.mjs")).toBe(true);
  expect(isRepositoryFixturePath("src/check.mjs")).toBe(false);
});
