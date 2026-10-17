import { expect, test } from "@jest/globals";
import { validatePackManifestPaths } from "../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/paths.mjs";

test("accepts safe package paths", () => {
  expect(validatePackManifestPaths([{ path: "src/index.mjs" }], ["src/"])).toBeNull();
});

test("rejects invalid manifests, allowlists, unsafe paths, and prohibited files", () => {
  expect(validatePackManifestPaths([{}], ["src/"])).toContain("files array");
  expect(validatePackManifestPaths([{ path: "src/index.mjs" }], undefined)).toContain(
    "must be an array",
  );
  expect(validatePackManifestPaths([{ path: "src/index.mjs" }], ["src/", "src/"])).toContain(
    "duplicates",
  );
  expect(validatePackManifestPaths([{ path: "src/index.mjs" }], ["src/**"])).toContain(
    "unsafe path entry",
  );
  expect(validatePackManifestPaths([{ path: "../secret" }], ["src/"])).toContain(
    "unsafe file path",
  );
  expect(validatePackManifestPaths([{ path: "src/test-fixtures/item.json" }], ["src/"])).toContain(
    "prohibited files",
  );
});
