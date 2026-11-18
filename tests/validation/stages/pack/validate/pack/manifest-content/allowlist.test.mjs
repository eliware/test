import { expect, test } from "@jest/globals";
import validatePackManifestAllowlist from "../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/allowlist.mjs";
test("validates package allowlist entries and packed coverage", () => {
  expect(validatePackManifestAllowlist([{ path: "src/index.mjs" }], ["src"])).toEqual({
    entryError: null,
    coverageError: null,
    unusedError: null,
  });
  expect(validatePackManifestAllowlist([], ["../unsafe"]).entryError).toContain(
    "unsafe path entry",
  );
  expect(validatePackManifestAllowlist([{ path: "outside.mjs" }], ["src"]).coverageError).toContain(
    "outside package.json.files",
  );
  expect(
    validatePackManifestAllowlist([{ path: "src/index.mjs" }], ["src", "docs"]).unusedError,
  ).toContain("entries do not match packed files");
});
