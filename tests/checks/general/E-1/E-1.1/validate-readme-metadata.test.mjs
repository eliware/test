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

test("requires npm metadata only for the applied npm-published profile", () => {
  expect(validateReadmeMetadata("", { publishConfig: { access: "public" } })).toBeNull();
  expect(validateReadmeMetadata("", { eliware: { apply: ["npm-published"] } })).toContain("npm version");
});

test("reports missing package metadata", () => {
  expect(validateReadmeMetadata(readme, { description: "different" })).toContain("project description");
  expect(validateReadmeMetadata(readme, { author: "missing" })).toContain("author");
  expect(validateReadmeMetadata(readme, { license: "Apache-2.0" })).toContain("license");
});
