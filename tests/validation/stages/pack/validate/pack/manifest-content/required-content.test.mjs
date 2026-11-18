import { expect, test } from "@jest/globals";
import validatePackManifestRequiredContent from "../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/required-content.mjs";
test("requires package metadata and documentation content", () => {
  expect(validatePackManifestRequiredContent([])).toContain("omitted required files");
});
