import { expect, test } from "@jest/globals";
import { validatePackageIdentity } from "../../../../../../src/checks/general/E-0.1.0.1.1/validate/package/identity.mjs";

const valid = {
  name: "@eliware/example",
  author: "Eliware <eliware@eliware.org>",
  repository: { type: "git", url: "git+https://github.com/eliware/example.git" },
  homepage: "https://github.com/eliware/example#readme",
  bugs: { url: "https://github.com/eliware/example/issues" },
};

test("accepts canonical package identity metadata", () => {
  expect(validatePackageIdentity(valid)).toEqual([]);
});

test.each([
  [{ name: null }, "package.json.name"],
  [{ name: "example" }, "package.json.name"],
  [{ author: "Other" }, "package.json.author"],
  [{ repository: undefined }, "package.json.repository"],
  [{ repository: "repo" }, "package.json.repository"],
  [{ repository: [] }, "package.json.repository"],
  [{ repository: { type: "git" } }, "package.json.repository"],
  [{ repository: { type: "svn", url: valid.repository.url } }, "package.json.repository"],
  [{ repository: { type: "git", url: "https://example.com" } }, "package.json.repository"],
  [{ homepage: "https://example.com" }, "package.json.homepage"],
  [{ bugs: { url: "https://example.com" } }, "package.json.bugs.url"],
])("reports invalid identity field %#", (change, message) => {
  expect(validatePackageIdentity({ ...valid, ...change }).join("\n")).toContain(message);
});

test("requires an object repository with exactly two canonical fields", () => {
  expect(
    validatePackageIdentity({
      ...valid,
      repository: { ...valid.repository, directory: "packages/example" },
    }),
  ).toContain("package.json.repository must use the canonical Eliware Git URL.");
});
