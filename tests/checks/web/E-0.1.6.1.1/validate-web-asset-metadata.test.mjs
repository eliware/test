import { expect, test } from "@jest/globals";
import { validateWebAssetMetadata } from "../../../../src/checks/web/E-0.1.6.1.1/validate-web-asset-metadata.mjs";

test("rejects package metadata for configurable web assets", () => {
  expect(validateWebAssetMetadata()).toEqual([]);
  expect(validateWebAssetMetadata({ eliware: {} })).toEqual([]);
  expect(
    validateWebAssetMetadata({ eliware: { webRoot: "public", webAssetExcludes: [] } }),
  ).toEqual([
    "Do not set package.json.eliware.webRoot. The web asset root is public/.",
    "Do not set package.json.eliware.webAssetExcludes. The web asset root is public/.",
  ]);
});
