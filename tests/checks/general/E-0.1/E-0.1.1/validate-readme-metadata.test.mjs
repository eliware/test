import { expect, test } from "@jest/globals";
import { validateReadmeMetadata } from "../../../../../src/checks/general/E-0.1/E-0.1.1/validate-readme-metadata.mjs";

const readme =
  "description author https://github.com/example/project MIT fixture https://npmjs.com/package/example\n## Links\n[repository](https://github.com/example/project.git)";
const metadata = {
  description: "description",
  author: "author",
  repository: "https://github.com/example/project",
  license: "MIT",
};

test("accepts represented metadata", () => {
  expect(
    validateReadmeMetadata(readme, { ...metadata, publishConfig: { access: "public" } }),
  ).toBeNull();
});

test("accepts an author object by its exact name field", () => {
  expect(
    validateReadmeMetadata(readme, {
      description: "description",
      author: { name: "author", email: "author@example.com" },
      repository: { url: "https://github.com/example/project" },
      license: "MIT",
    }),
  ).toBeNull();
});

test("requires npm metadata only for the applied npm-published profile", () => {
  expect(validateReadmeMetadata(readme, metadata)).toBeNull();
  expect(validateReadmeMetadata(readme, { ...metadata, eliware: null })).toBeNull();
  expect(validateReadmeMetadata(readme, { ...metadata, eliware: { apply: null } })).toBeNull();
  expect(
    validateReadmeMetadata(readme, { ...metadata, eliware: { apply: ["npm-published"] } }),
  ).toBeNull();
  expect(
    validateReadmeMetadata(readme.replace("https://npmjs.com/package/example", ""), {
      ...metadata,
      eliware: { apply: ["npm-published"] },
    }),
  ).toContain("npm version");
});

test("reports missing package metadata", () => {
  expect(validateReadmeMetadata(readme, { ...metadata, description: "  " })).toContain(
    "project description",
  );
  expect(validateReadmeMetadata(readme, { ...metadata, description: "different" })).toContain(
    "project description",
  );
  expect(validateReadmeMetadata(readme, { ...metadata, author: "missing" })).toContain("author");
  expect(validateReadmeMetadata(readme, { ...metadata, author: null })).toContain("author");
  expect(validateReadmeMetadata(readme, { ...metadata, license: "Apache-2.0" })).toContain(
    "license",
  );
  expect(validateReadmeMetadata(readme, {})).toContain("valid README metadata");
  expect(validateReadmeMetadata(readme)).toContain("valid README metadata");
  expect(
    validateReadmeMetadata(readme, {
      ...metadata,
      author: { email: "author@example.com" },
    }),
  ).toContain("author");
});

test("requires the canonical HTTPS .git repository URL in the Links section", () => {
  const withoutExactLink = readme.replace(
    "[repository](https://github.com/example/project.git)",
    "repository",
  );
  expect(
    validateReadmeMetadata(withoutExactLink, {
      ...metadata,
    }),
  ).toContain("Links section");
});
