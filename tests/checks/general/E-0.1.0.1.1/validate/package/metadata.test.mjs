import { expect, test } from "@jest/globals";
import { validatePackageMetadata } from "../../../../../../src/checks/general/E-0.1.0.1.1/validate/package/metadata.mjs";
import {
  conventionVersion,
  nextMinorVersion,
  packageVersion,
} from "../../../../../helpers/project-version.mjs";

const valid = {
  name: "@eliware/example",
  version: packageVersion,
  description: "Example package",
  keywords: ["eliware", "example"],
  private: true,
  author: "Eliware <eliware@eliware.org>",
  repository: { type: "git", url: "git+https://github.com/eliware/example.git" },
  homepage: "https://github.com/eliware/example#readme",
  bugs: { url: "https://github.com/eliware/example/issues" },
  license: "MIT",
  type: "module",
  engines: { node: ">=26" },
};

test("accepts canonical package metadata", () => {
  expect(validatePackageMetadata(valid)).toEqual([]);
});

test("accepts 20 keywords and rejects more than 20", () => {
  expect(
    validatePackageMetadata({
      ...valid,
      keywords: Array.from({ length: 20 }, (_, index) => `key-${index}`),
    }),
  ).toEqual([]);
  expect(
    validatePackageMetadata({
      ...valid,
      keywords: Array.from({ length: 21 }, (_, index) => `key-${index}`),
    }),
  ).toContain("package.json.keywords must contain no more than 20 entries.");
});

test.each([
  [{ name: "example" }, "scoped @eliware"],
  [{ version: nextMinorVersion }, `Convention v${conventionVersion}`],
  [{ version: `${packageVersion}-beta` }, "numeric MAJOR"],
  [{ description: " " }, "description"],
  [{ keywords: ["one", "one"] }, "distinct"],
  [{ keywords: [""] }, "nonempty strings"],
  [{ private: "false" }, "private must be boolean"],
  [{ author: "Other" }, "author"],
  [{ license: "ISC" }, "license"],
  [{ type: "commonjs" }, "type"],
  [{ type: undefined }, 'package.json.type must be "module"'],
  [{ engines: { node: "26" } }, 'engines.node must be ">=26"'],
  [{ repository: { type: "git", url: "https://example.com" } }, "repository"],
  [{ homepage: "https://example.com" }, "homepage"],
  [{ bugs: undefined }, "package.json.bugs.url"],
  [{ bugs: { url: "not a URL" } }, "package.json.bugs.url"],
  [{ bugs: { url: "https://github.com/eliware/other/issues" } }, "package.json.bugs.url"],
])("reports invalid package field %#", (change, message) => {
  expect(validatePackageMetadata({ ...valid, ...change }).join("\n")).toContain(message);
});

test("reports invalid package metadata when the package name is not a string", () => {
  expect(validatePackageMetadata({ ...valid, name: null }).join("\n")).toContain("scoped @eliware");
});
