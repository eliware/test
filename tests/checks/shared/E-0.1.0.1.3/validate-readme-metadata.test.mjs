import { expect, test } from "@jest/globals";
import { validateReadmeMetadata } from "../../../../src/checks/shared/E-0.1.0.1.3/validate-readme-metadata.mjs";

test("requires package fields and includes their exact values", () => {
  expect(validateReadmeMetadata("", {})).toContain("description, author, and license");
  expect(validateReadmeMetadata("", undefined)).toContain("description, author, and license");
  const pkg = { description: "Description", author: { name: "Author" }, license: "MIT" };
  expect(validateReadmeMetadata("Author: Author\nLicense: MIT", pkg)).toBeNull();
  expect(validateReadmeMetadata("Description", pkg)).toContain("author, license");
  expect(validateReadmeMetadata("```text\nAuthor: Author\nLicense: MIT\n```", pkg)).toContain(
    "author, license",
  );
});

test("does not accept values outside their named metadata fields", () => {
  const pkg = { description: "Description", author: "Author", license: "MIT" };
  expect(
    validateReadmeMetadata("A paragraph contains Description, Author, and MIT.", pkg),
  ).toContain("author, license");
});
