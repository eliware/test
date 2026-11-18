import { expect, test } from "@jest/globals";
import validatePackedManifestFiles from "../../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/packed/files.mjs";
test("checks manifest shape before paths", () => {
  expect(validatePackedManifestFiles(null)).toEqual({
    shapeError: "npm pack JSON manifest must contain a files array with paths.",
    pathError: null,
  });
  expect(validatePackedManifestFiles([{ path: "../unsafe" }])).toMatchObject({
    shapeError: null,
    pathError: expect.stringContaining("unsafe file path"),
  });
});
