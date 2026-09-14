import { expect, test } from "@jest/globals";
import { validatePackageMetadata } from "../../../../src/checks/general/E-1/validate-package-metadata.mjs";

test("validates descriptive, licensing, keyword, and repository metadata", () => {
  const valid = { description: "Example", author: { name: "Eliware" }, license: "MIT", keywords: ["example"], repository: { url: "https://example.test" } };
  expect(validatePackageMetadata(valid)).toBeNull();
  expect(validatePackageMetadata({ ...valid, license: "ISC" })).toContain("MIT");
  expect(validatePackageMetadata({ ...valid, repository: { url: "" } })).toContain("repository");
});
