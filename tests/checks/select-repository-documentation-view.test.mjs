import { expect, test } from "@jest/globals";
import { selectRepositoryDocumentationView } from "../../src/checks/select-repository-documentation-view.mjs";

const files = [
  "README.md",
  "docs/policy.json",
  "test-results/report.md",
  "dist/generated.json",
  "src/index.mjs",
];

test("selects documentation files while excluding generated directories", () => {
  expect(selectRepositoryDocumentationView("documentation", files)).toEqual([
    "README.md",
    "docs/policy.json",
    "test-results/report.md",
  ]);
});

test("selects JSON files independently of documentation and generated-path filtering", () => {
  expect(selectRepositoryDocumentationView("json", files)).toEqual([
    "docs/policy.json",
    "dist/generated.json",
  ]);
});

test("returns undefined for view types it does not own", () => {
  expect(selectRepositoryDocumentationView("source", files)).toBeUndefined();
});
