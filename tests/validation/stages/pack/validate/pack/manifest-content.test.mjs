import { expect, test } from "@jest/globals";
import { validatePackManifestContent } from "../../../../../../src/validation/stages/pack/validate/pack/manifest-content.mjs";

test("returns path errors before coverage errors", () => {
  const result = validatePackManifestContent([{ path: "../unsafe" }], []);
  expect(result).toContain("unsafe file path");
  expect(result).not.toContain("omitted required files");
});
