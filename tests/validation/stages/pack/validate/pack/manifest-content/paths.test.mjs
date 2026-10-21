import { expect, test } from "@jest/globals";
import { validatePackManifestAllowlist } from "../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/paths.mjs";

test("accepts a safe package allowlist", () => {
  expect(validatePackManifestAllowlist(["src/"])).toBeNull();
});

test("rejects missing, duplicate, and unsafe package allowlists", () => {
  expect(validatePackManifestAllowlist(undefined)).toContain("must be an array");
  expect(validatePackManifestAllowlist(["src/", "src/"])).toContain("duplicates");
  expect(validatePackManifestAllowlist(["src/**"])).toContain("unsafe path entry");
});
