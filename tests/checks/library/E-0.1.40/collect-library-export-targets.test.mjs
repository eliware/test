import { expect, test } from "@jest/globals";
import { collectLibraryExportTargets } from "../../../../src/checks/library/E-0.1.40/collect-library-export-targets.mjs";

test("collects string targets from nested conditional export shapes", () => {
  expect(collectLibraryExportTargets({
    ".": ["./index.mjs", { types: "./index.d.ts", import: "./index.mjs" }],
    "./feature": { node: { import: "./feature.mjs", require: "./feature.cjs" } },
  })).toEqual([
    "./index.mjs", "./index.d.ts", "./index.mjs", "./feature.mjs", "./feature.cjs",
  ]);
});

test("ignores null and non-string export target values", () => {
  expect(collectLibraryExportTargets(null)).toEqual([]);
  expect(collectLibraryExportTargets({ ".": null, "./empty": 42 })).toEqual([]);
});
