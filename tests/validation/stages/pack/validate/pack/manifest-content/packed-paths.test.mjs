import { expect, test } from "@jest/globals";
import {
  validatePackedManifestPaths,
  validatePackedManifestShape,
} from "../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/packed-paths.mjs";

test("accepts safe packed paths", () => {
  expect(validatePackedManifestShape([{ path: "src/index.mjs" }])).toBeNull();
  expect(validatePackedManifestPaths([{ path: "src/index.mjs" }])).toBeNull();
});

test("rejects invalid packed manifest entries", () => {
  expect(validatePackedManifestShape([{}])).toContain("files array");
});

test("rejects unsafe and prohibited packed paths", () => {
  expect(validatePackedManifestPaths([{ path: "../secret" }])).toContain("unsafe file path");
  expect(validatePackedManifestPaths([{ path: "src/test-fixtures/item.json" }])).toContain(
    "prohibited files",
  );
});
