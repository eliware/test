import { expect, test } from "@jest/globals";
import { validatePackageMetadata } from "../../../../src/checks/general/E-0.1/validate-package-metadata.mjs";

test("validates descriptive, licensing, keyword, and repository metadata", () => {
  const valid = {
    description: "Example",
    name: "@eliware/example",
    author: "Eliware <eliware@eliware.org>",
    license: "MIT",
    keywords: ["eliware", "example"],
    repository: { type: "git", url: "git+https://github.com/eliware/example.git" },
    homepage: "https://github.com/eliware/example#readme",
  };
  expect(validatePackageMetadata(valid)).toBeNull();
  expect(validatePackageMetadata({ ...valid, author: "Eliware" })).toContain("author");
  expect(validatePackageMetadata({ ...valid, description: " " })).toContain("description");
  expect(validatePackageMetadata({ ...valid, keywords: [] })).toContain("keywords");
  expect(validatePackageMetadata({ ...valid, keywords: [" "] })).toContain("keywords");
  expect(validatePackageMetadata({ ...valid, keywords: [1] })).toContain("keywords");
  expect(validatePackageMetadata({ ...valid, keywords: ["eliware", "eliware"] })).toContain(
    "duplicates",
  );
  expect(validatePackageMetadata({ ...valid, license: "ISC" })).toContain("MIT");
  expect(validatePackageMetadata({ ...valid, repository: { type: "git", url: "" } })).toContain(
    "repository",
  );
  expect(validatePackageMetadata({ ...valid, repository: valid.repository.url })).toContain(
    "repository",
  );
  expect(validatePackageMetadata({ ...valid, homepage: "https://example.test" })).toContain(
    "homepage",
  );
  expect(
    validatePackageMetadata({ ...valid, repository: { ...valid.repository, directory: "src" } }),
  ).toContain("repository");
});

test("uses the repo-map repository identity as the canonical package slug", () => {
  const packageJson = {
    name: "@eliware/wrong-name",
    author: "Eliware <eliware@eliware.org>",
    description: "Example",
    license: "MIT",
    keywords: ["eliware", "example"],
    repository: { type: "git", url: "git+https://github.com/eliware/example.git" },
    homepage: "https://github.com/eliware/example#readme",
  };
  expect(validatePackageMetadata(packageJson, { repository: "eliware/example" })).toBeNull();
  expect(validatePackageMetadata(packageJson)).toContain("repository");
});

test("rejects canonical repository metadata when neither map nor package slug exists", () => {
  expect(
    validatePackageMetadata({
      description: "Example",
      author: "Eliware <eliware@eliware.org>",
      license: "MIT",
      keywords: ["eliware"],
      repository: {},
      homepage: "https://github.com/eliware/example#readme",
    }),
  ).toContain("canonical Eliware Git repository object");
});
