import { expect, test } from "@jest/globals";
import { validatePackManifest } from "../../../../src/validation/stages/pack/validate-pack-manifest.mjs";

const basePaths = [
  "package.json",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "RELEASE_NOTES.md",
  "src/index.mjs",
  "docs/README.md",
];
const baseAllowlist = ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md"];
const manifest = (paths) => JSON.stringify([{ files: paths.map((path) => ({ path })) }]);

test("accepts actual packed files covered by the profile allowlist", () => {
  expect(validatePackManifest(manifest(basePaths), baseAllowlist)).toBeNull();
});

test("accepts npm's object-shaped manifest and rejects malformed file entries", () => {
  expect(
    validatePackManifest(
      JSON.stringify({ files: basePaths.map((path) => ({ path })) }),
      baseAllowlist,
    ),
  ).toBeNull();
  expect(
    validatePackManifest(
      JSON.stringify({ target: { name: "target", files: basePaths.map((path) => ({ path })) } }),
      baseAllowlist,
      "target",
    ),
  ).toBeNull();
  expect(validatePackManifest(JSON.stringify([{ files: [{ path: 7 }] }]), baseAllowlist)).toContain(
    "files array",
  );
  expect(validatePackManifest("null", baseAllowlist)).toContain("files array");
});

test("rejects invalid, incomplete, and unallowlisted packed paths", () => {
  expect(validatePackManifest("not json", baseAllowlist)).toContain("invalid JSON");
  expect(validatePackManifest('{"size":[REDACTED]2,}', baseAllowlist)).toContain("invalid JSON");
  expect(validatePackManifest(manifest(["package.json"]), baseAllowlist)).toContain("omitted");
  expect(validatePackManifest(manifest([...basePaths, "unexpected.txt"]), baseAllowlist)).toContain(
    "outside",
  );
  expect(validatePackManifest(manifest(basePaths), ["src/", "docs/", "examples/"])).toContain(
    "outside package.json.files",
  );
  expect(validatePackManifest(manifest(basePaths), [...baseAllowlist, "examples/"])).toContain(
    "do not match",
  );
  expect(validatePackManifest(manifest(basePaths), undefined)).toContain("must be an array");
});

test("requires common payload files to be explicitly covered by the allowlist", () => {
  expect(validatePackManifest(manifest(basePaths), ["src/", "docs/"])).toContain(
    "outside package.json.files",
  );
});

test("rejects wildcard, traversal, absolute, and empty allowlist paths", () => {
  for (const unsafePath of ["src/**", "../secret", "./", "/etc", "C:/private", ""]) {
    expect(validatePackManifest(manifest(basePaths), [unsafePath])).toContain("unsafe path entry");
  }
});

test("rejects duplicate and non-string package allowlist entries", () => {
  expect(validatePackManifest(manifest(basePaths), [...baseAllowlist, "src/"])).toContain(
    "must not contain duplicates",
  );
  expect(validatePackManifest(manifest(basePaths), [...baseAllowlist, null])).toContain(
    "unsafe path entry",
  );
});

test("rejects packed paths that escape the package root", () => {
  expect(validatePackManifest(manifest([...basePaths, "../secret"]), baseAllowlist)).toContain(
    "unsafe file path",
  );
});

test("rejects prohibited package content and omitted entrypoints", () => {
  expect(
    validatePackManifest(manifest([...basePaths, "src/test-fixtures/fixture.json"]), baseAllowlist),
  ).toContain("prohibited files");
  expect(
    validatePackManifest(manifest(basePaths), baseAllowlist, undefined, {
      main: "./src/missing.mjs",
    }),
  ).toContain("public package entrypoints");
});

test("requires nonempty runtime and documentation trees and all allowlist entries to be used", () => {
  const emptyRuntime = [
    "package.json",
    "README.md",
    "AGENTS.md",
    "LICENSE",
    "RELEASE_NOTES.md",
    "docs/README.md",
  ];
  expect(validatePackManifest(manifest(emptyRuntime), baseAllowlist)).toContain("runtime files");
  const noDocs = basePaths.filter((path) => path !== "docs/README.md");
  expect(validatePackManifest(manifest(noDocs), baseAllowlist)).toContain("documentation files");
});
