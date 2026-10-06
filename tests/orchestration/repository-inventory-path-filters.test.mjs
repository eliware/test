import { expect, test } from "@jest/globals";
import {
  isGeneratedRepositoryPath,
  isRepositoryFixturePath,
  isRepositoryIgnoredPath,
} from "../../src/orchestration/repository-inventory-path-filters.mjs";

test("classifies ignored, generated, and fixture repository paths", () => {
  expect(isRepositoryIgnoredPath("test-results/report.md")).toBe(true);
  expect(isRepositoryIgnoredPath("tests/report.md")).toBe(false);
  expect(isGeneratedRepositoryPath("dist/bundle.mjs")).toBe(true);
  expect(isGeneratedRepositoryPath("src/index.mjs")).toBe(false);
  expect(isRepositoryFixturePath("src/test-fixtures/example.mjs")).toBe(true);
  expect(isRepositoryFixturePath("src/check.mjs")).toBe(false);
});
