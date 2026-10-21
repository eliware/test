import { expect, test } from "@jest/globals";
import {
  validatePackManifestUnexpectedPaths,
  validatePackManifestUnusedAllowlistEntries,
} from "../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/allowlist-coverage.mjs";

const packed = [{ path: "package.json" }, { path: "src/index.mjs" }, { path: "README.md" }];

test("rejects packed files outside package.json.files", () => {
  expect(validatePackManifestUnexpectedPaths([...packed, { path: "extra.txt" }], ["src/"])).toBe(
    "npm pack included files outside package.json.files: README.md, extra.txt.",
  );
});

test("allows package.json and paths covered by file entries", () => {
  expect(validatePackManifestUnexpectedPaths(packed, ["src/", "README.md"])).toBeNull();
});

test("reports allowlist entries that do not match packed files", () => {
  expect(validatePackManifestUnusedAllowlistEntries(packed, ["src/", "examples/"])).toBe(
    "package.json.files entries do not match packed files: examples/.",
  );
});

test("accepts allowlist entries that match packed files", () => {
  expect(validatePackManifestUnusedAllowlistEntries(packed, ["src/", "README.md"])).toBeNull();
});
