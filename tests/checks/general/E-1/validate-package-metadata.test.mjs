import { expect, test } from "@jest/globals";
import { validatePackageMetadata } from "../../../../src/checks/general/E-1/validate-package-metadata.mjs";

test("validates descriptive, licensing, keyword, and repository metadata", () => {
  const valid = { description: "Example", author: { name: "Eliware" }, license: "MIT", keywords: ["example"], repository: { url: "https://example.test" } };
  expect(validatePackageMetadata(valid)).toBeNull();
  expect(validatePackageMetadata({ ...valid, author: "Eliware", repository: "https://example.test" })).toBeNull();
  expect(validatePackageMetadata({ ...valid, author: { name: " " } })).toContain("description and author");
  expect(validatePackageMetadata({ ...valid, description: " " })).toContain("description and author");
  expect(validatePackageMetadata({ ...valid, keywords: [] })).toContain("keywords");
  expect(validatePackageMetadata({ ...valid, keywords: [" "] })).toContain("keywords");
  expect(validatePackageMetadata({ ...valid, keywords: [1] })).toContain("keywords");
  expect(validatePackageMetadata({ ...valid, license: "ISC" })).toContain("MIT");
  expect(validatePackageMetadata({ ...valid, repository: { url: "" } })).toContain("repository");
  expect(validatePackageMetadata({ ...valid, repository: " " })).toContain("repository");
});
