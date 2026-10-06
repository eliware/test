import { expect, test } from "@jest/globals";
import { mapFocusedSourceExtension } from "../../../../../src/orchestration/general/E-0.1/E-0.1.20/map-focused-source-extension.mjs";

test("maps TypeScript ESM and CommonJS test extensions to native ESM source", () => {
  expect(mapFocusedSourceExtension(".mts")).toBe(".mjs");
  expect(mapFocusedSourceExtension(".cts")).toBe(".mjs");
});

test("preserves all other focused source extensions", () => {
  for (const extension of [".mjs", ".js", ".ts", ".cjs", ".jsx", ""]) {
    expect(mapFocusedSourceExtension(extension)).toBe(extension);
  }
});
