import { expect, test } from "@jest/globals";
import { validateReadmeMetadata } from "../../../../src/checks/general/E-0.1.0.1.3/validate-readme-metadata.mjs";

test("requires package fields and includes their exact values", () => {
  expect(validateReadmeMetadata("", {})).toContain("description, author, and license");
  expect(validateReadmeMetadata("", undefined)).toContain("description, author, and license");
  const pkg = { description: "Description", author: { name: "Author" }, license: "MIT" };
  expect(validateReadmeMetadata("Description Author MIT", pkg)).toBeNull();
  expect(validateReadmeMetadata("Description", pkg)).toContain("author, license");
  expect(validateReadmeMetadata("```text\nDescription Author MIT\n```", pkg)).toContain(
    "description, author, license",
  );
});
