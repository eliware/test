import { expect, test } from "@jest/globals";
import { validatePackManifest } from "../../../../src/checks/npm-published/E-0.1.140/validate-pack-manifest.mjs";

const manifest = (paths) => JSON.stringify([{ files: paths.map((path) => ({ path })) }]);

test("accepts packed files covered by the allowlist and required files", () => {
  expect(
    validatePackManifest(
      manifest([
        "package.json",
        "README.md",
        "LICENSE",
        "RELEASE_NOTES.md",
        "src/index.mjs",
        "docs/README.md",
      ]),
      ["src/", "docs/"],
    ),
  ).toBeNull();
});

test("accepts npm's object-shaped manifest and rejects malformed file entries", () => {
  const paths = ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"];
  expect(
    validatePackManifest(JSON.stringify({ files: paths.map((path) => ({ path })) }), []),
  ).toBeNull();
  expect(
    validatePackManifest(
      JSON.stringify({ target: { name: "target", files: paths.map((path) => ({ path })) } }),
      [],
      "target",
    ),
  ).toBeNull();
  expect(validatePackManifest(manifest(paths), null)).toBeNull();
  expect(validatePackManifest(JSON.stringify([{ files: [{ path: 7 }] }]), [])).toContain(
    "files array",
  );
  expect(validatePackManifest("null", [])).toContain("files array");
});

test("rejects invalid, incomplete, and over-broad pack manifests", () => {
  expect(validatePackManifest("not json", ["src/"])).toContain("invalid JSON");
  expect(validatePackManifest('{"size":[REDACTED]2,}', [])).toContain("invalid JSON");
  expect(validatePackManifest(manifest(["package.json"]), ["src/"])).toContain("omitted");
  expect(
    validatePackManifest(
      manifest(["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md", "secret.txt"]),
      ["src/"],
    ),
  ).toContain("outside");
  expect(
    validatePackManifest(manifest(["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"]), [
      "src/",
    ]),
  ).toContain("do not match");
});

test("rejects wildcard, traversal, absolute, and empty allowlist paths", () => {
  const required = ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"];
  for (const unsafePath of ["src/**", "../secret", "./", "/etc", "C:/private", ""]) {
    expect(validatePackManifest(manifest(required), [unsafePath])).toContain("unsafe path entry");
  }
});

test("rejects packed paths that escape the package root", () => {
  expect(
    validatePackManifest(
      manifest(["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md", "../secret"]),
      [],
    ),
  ).toContain("unsafe file path");
});

test("treats duplicate allowlist entries and trailing slashes as equivalent", () => {
  const output = manifest([
    "package.json",
    "README.md",
    "LICENSE",
    "RELEASE_NOTES.md",
    "src/index.mjs",
  ]);
  expect(validatePackManifest(output, ["src", "src/"])).toBeNull();
});
