import { expect, test } from "@jest/globals";
import { validateReadmeMetadata } from "../../../../../src/checks/general/E-1/E-1.1/validate-readme-metadata.mjs";

const readme = "description author https://github.com/example MIT fixture https://npmjs.com/package/example";

test("accepts represented metadata", () => {
  expect(validateReadmeMetadata(readme)).toBeNull();
  expect(validateReadmeMetadata(readme, {
    description: "description",
    author: "author",
    repository: "https://github.com/example",
    license: "MIT",
    publishConfig: { access: "public" },
  })).toBeNull();
});

test("reports missing publication or package metadata", () => {
  expect(validateReadmeMetadata("", { publishConfig: { access: "public" } })).toContain("npm version");
  expect(validateReadmeMetadata(readme, { description: "different" })).toContain("project description");
  expect(validateReadmeMetadata(readme, { author: "missing" })).toContain("author");
  expect(validateReadmeMetadata(readme, { license: "Apache-2.0" })).toContain("license");
});
