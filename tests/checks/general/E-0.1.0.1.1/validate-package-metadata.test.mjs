import { expect, test } from "@jest/globals";
import { validatePackageMetadata } from "../../../../src/checks/general/E-0.1.0.1.1/validate-package-metadata.mjs";

const valid = {
  name: "@eliware/example",
  version: "12.0.4",
  description: "Example package",
  keywords: ["eliware", "example"],
  private: true,
  author: "Eliware <eliware@eliware.org>",
  repository: { type: "git", url: "git+https://github.com/eliware/example.git" },
  homepage: "https://github.com/eliware/example#readme",
  license: "MIT",
  type: "module",
  engines: { node: "26" },
};

test("accepts canonical package metadata", () => {
  expect(validatePackageMetadata(valid)).toEqual([]);
});

test.each([
  [{ name: "example" }, "scoped @eliware"],
  [{ version: "12.1.0" }, "Convention v12.0"],
  [{ version: "12.0.0-beta" }, "numeric MAJOR"],
  [{ description: " " }, "description"],
  [{ keywords: ["one", "one"] }, "distinct"],
  [{ keywords: [""] }, "nonempty strings"],
  [{ private: "false" }, "private must be boolean"],
  [{ author: "Other" }, "author"],
  [{ license: "ISC" }, "license"],
  [{ type: "commonjs" }, "type"],
  [{ engines: { node: ">=20" } }, "engines.node"],
  [{ repository: { type: "git", url: "https://example.com" } }, "repository"],
  [{ homepage: "https://example.com" }, "homepage"],
])("reports invalid package field %#", (change, message) => {
  expect(validatePackageMetadata({ ...valid, ...change }).join("\n")).toContain(message);
});

test("reports invalid package metadata when the package name is not a string", () => {
  expect(validatePackageMetadata({ ...valid, name: null }).join("\n")).toContain("scoped @eliware");
});
