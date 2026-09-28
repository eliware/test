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
  expect(validatePackManifest(manifest(paths), null)).toBeNull();
  expect(validatePackManifest(JSON.stringify([{ files: [{ path: 7 }] }]), [])).toContain(
    "files array",
  );
  expect(validatePackManifest("null", [])).toContain("files array");
});

test("accepts npm 12 scoped object-shaped manifests", () => {
  const paths = ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"];
  expect(
    validatePackManifest(
      JSON.stringify({ "@eliware/codescope": { files: paths.map((path) => ({ path })) } }),
      [],
    ),
  ).toBeNull();
  expect(
    validatePackManifest(
      JSON.stringify({
        "@eliware/codescope": {
          name: "@eliware/codescope",
          files: paths.map((path) => ({ path })),
        },
      }),
      [],
      "@eliware/codescope",
    ),
  ).toBeNull();
  expect(
    validatePackManifest(
      JSON.stringify({
        "@eliware/codescope": { name: "@eliware/other", files: paths.map((path) => ({ path })) },
      }),
      [],
      "@eliware/codescope",
    ),
  ).toContain("requested package");
});

test("parses npm pack metadata after numeric redaction", () => {
  const paths = ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"];
  const output = JSON.stringify({
    "@eliware/test": {
      name: "@eliware/test",
      size: 12034,
      files: paths.map((path) => ({ path, size: 123, mode: 420 })),
      entryCount: paths.length,
    },
  }).replaceAll("123", "[REDACTED]3");

  expect(validatePackManifest(output, [], "@eliware/test")).toBeNull();
});

test("selects the manifest for the package being packed and rejects ambiguity", () => {
  const files = ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"].map((path) => ({
    path,
  }));
  const output = JSON.stringify([
    { name: "@eliware/unrelated", files: [{ path: "package.json" }] },
    { name: "@eliware/target", files },
  ]);
  expect(validatePackManifest(output, [], "@eliware/target")).toBeNull();
  expect(validatePackManifest(output, [], "@eliware/missing")).toContain("requested package");
  expect(
    validatePackManifest(JSON.stringify({ name: "@eliware/target", files }), [], "@eliware/target"),
  ).toBeNull();
  expect(
    validatePackManifest(JSON.stringify({ name: "@eliware/other", files }), [], "@eliware/target"),
  ).toContain("requested package");
  expect(
    validatePackManifest(
      JSON.stringify({
        "@eliware/target": { name: "@eliware/target", files },
        "@eliware/other": { files: [{ path: "wrong.txt" }] },
      }),
      [],
      "@eliware/target",
    ),
  ).toBeNull();
  expect(
    validatePackManifest(
      JSON.stringify({
        "@eliware/target": { name: "@eliware/wrong", files },
      }),
      [],
      "@eliware/target",
    ),
  ).toContain("requested package");
  expect(validatePackManifest(JSON.stringify({ "@eliware/target": { files } }), [])).toBeNull();
  expect(
    validatePackManifest(
      JSON.stringify({ "@eliware/target": { files }, "@eliware/other": { files } }),
      [],
    ),
  ).toContain("requested package");
  expect(
    validatePackManifest(JSON.stringify({ "@eliware/other": { files } }), [], "@eliware/target"),
  ).toContain("requested package");
  expect(validatePackManifest("{}", [])).toContain("requested package");
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
