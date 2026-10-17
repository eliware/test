import { expect, test } from "@jest/globals";
import { validatePackManifestContent } from "../../../../../../src/validation/stages/pack/validate/pack/manifest-content.mjs";

const requiredPaths = [
  "package.json",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "RELEASE_NOTES.md",
  "specs/directives.yaml",
  "src/index.mjs",
  "docs/README.md",
];
const allowlist = [
  "src/",
  "docs/",
  "specs/",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "RELEASE_NOTES.md",
];
const packed = (paths) => paths.map((path) => ({ path }));

test("accepts complete packed content covered by the allowlist", () => {
  expect(validatePackManifestContent(packed(requiredPaths), allowlist)).toBeNull();
});

test("rejects missing packed records and invalid package file lists", () => {
  expect(validatePackManifestContent([{}], allowlist)).toContain("files array");
  expect(validatePackManifestContent(packed(requiredPaths), undefined)).toContain(
    "must be an array",
  );
  expect(validatePackManifestContent(packed(requiredPaths), [...allowlist, "src/"])).toContain(
    "must not contain duplicates",
  );
  expect(validatePackManifestContent(packed(requiredPaths), [...allowlist, null])).toContain(
    "unsafe path entry",
  );
});

test("rejects unsafe paths and prohibited packed files", () => {
  expect(validatePackManifestContent(packed([...requiredPaths, "../secret"]), allowlist)).toContain(
    "unsafe file path",
  );
  expect(validatePackManifestContent(packed(requiredPaths), ["src/**"])).toContain(
    "unsafe path entry",
  );
  expect(
    validatePackManifestContent(
      packed([...requiredPaths, "src/test-fixtures/item.json"]),
      allowlist,
    ),
  ).toContain("prohibited files");
});

test("requires explicit allowlist coverage for packed content", () => {
  expect(validatePackManifestContent(packed(requiredPaths), ["src/", "docs/"])).toContain(
    "outside package.json.files",
  );
  expect(validatePackManifestContent(packed([...requiredPaths, "extra.txt"]), allowlist)).toContain(
    "outside package.json.files",
  );
});

test("requires common package files and nonempty runtime trees", () => {
  expect(validatePackManifestContent(packed(["package.json"]), allowlist)).toContain("omitted");
  const noSource = requiredPaths.filter((path) => !path.startsWith("src/"));
  const noDocs = requiredPaths.filter((path) => !path.startsWith("docs/"));
  const noSpecs = requiredPaths.filter((path) => !path.startsWith("specs/"));
  expect(validatePackManifestContent(packed(noSource), allowlist)).toContain("runtime files");
  expect(validatePackManifestContent(packed(noDocs), allowlist)).toContain("documentation files");
  expect(validatePackManifestContent(packed(noSpecs), allowlist)).toContain("specification files");
});

test("requires each allowlist entry to match a packed path", () => {
  expect(validatePackManifestContent(packed(requiredPaths), [...allowlist, "examples/"])).toContain(
    "do not match",
  );
});
