import { expect, test } from "@jest/globals";
import { validatePackagePublicationMetadata } from "../../../../src/checks/general/E-1/validate-package-publication-metadata.mjs";

test("does not require publication metadata for unrelated profiles", () => {
  expect(validatePackagePublicationMetadata({ eliware: { apply: ["general"] } })).toBeNull();
  expect(validatePackagePublicationMetadata({})).toBeNull();
});

test("enforces private and npm-published package metadata", () => {
  expect(validatePackagePublicationMetadata({ eliware: { apply: ["private"] }, private: true })).toBeNull();
  expect(validatePackagePublicationMetadata({ eliware: { apply: ["private"] }, private: false })).toContain("private");
  expect(validatePackagePublicationMetadata({ eliware: { apply: ["npm-published"] }, private: true, publishConfig: { provenance: true } })).toContain("npm-published");
  expect(validatePackagePublicationMetadata({ eliware: { apply: ["npm-published"] }, private: false })).toContain("provenance");
  expect(validatePackagePublicationMetadata({ eliware: { apply: ["npm-published"] }, private: false, publishConfig: { provenance: true } })).toBeNull();
});
