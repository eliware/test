import { expect, test } from "@jest/globals";
import { selectRepositorySourceView } from "../../src/orchestration/select-repository-source-view.mjs";

const files = [
  "src/index.mjs",
  "src/tool.cjs",
  "src/types.ts",
  "docs/example.mjs",
  "src/test-fixtures/fixture.mjs",
  "src/snapshot.snap.mjs",
  "src/declaration.d.mts",
  "src/helper.generated.mjs",
];

test("selects source modules of supported JavaScript and TypeScript types", () => {
  expect(selectRepositorySourceView("source", files)).toEqual([
    "src/index.mjs",
    "src/tool.cjs",
    "src/types.ts",
    "docs/example.mjs",
    "src/test-fixtures/fixture.mjs",
    "src/snapshot.snap.mjs",
    "src/helper.generated.mjs",
  ]);
});

test("selects only maintained source files for coverage", () => {
  expect(selectRepositorySourceView("coverageSource", files)).toEqual([
    "src/index.mjs",
    "src/tool.cjs",
    "src/helper.generated.mjs",
  ]);
});

test("selects line-limit candidates without fixtures, declarations, or generated snapshots", () => {
  expect(selectRepositorySourceView("lineLimitSource", files)).toEqual([
    "src/index.mjs",
    "docs/example.mjs",
  ]);
});

test("returns undefined for view types it does not own", () => {
  expect(selectRepositorySourceView("json", files)).toBeUndefined();
});
