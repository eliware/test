import { expect, test } from "@jest/globals";
import { collectLibraryExportTargets } from "../../../../src/checks/library/E-0.1.3.1.1/collect-library-export-targets.mjs";

test("collects conditional export targets", () => {
  expect(
    collectLibraryExportTargets({ ".": ["./src/index.mjs", { types: "./src/index.d.ts" }] }),
  ).toEqual(["./src/index.mjs", "./src/index.d.ts"]);
  expect(collectLibraryExportTargets(null)).toEqual([]);
});
