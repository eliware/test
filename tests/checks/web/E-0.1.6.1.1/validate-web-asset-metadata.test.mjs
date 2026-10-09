import { expect, test } from "@jest/globals";
import { validateWebAssetMetadata } from "../../../../src/checks/web/E-0.1.6.1.1/validate-web-asset-metadata.mjs";

test("rejects package metadata for configurable web assets", () => {
  expect(validateWebAssetMetadata()).toEqual([]);
  expect(validateWebAssetMetadata({ eliware: {} })).toEqual([]);
  expect(
    validateWebAssetMetadata({ eliware: { webRoot: "public", webAssetExcludes: [] } }),
  ).toEqual([
    "Do not set package.json.eliware.webRoot; the web asset root is public/.",
    "Do not set package.json.eliware.webAssetExcludes; the web asset root is public/.",
  ]);
});
