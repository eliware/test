import { expect, test } from "@jest/globals";
import { validatePackManifest } from "../../../../src/checks/npm-published/E-1.140/validate-pack-manifest.mjs";

const manifest = (paths) => JSON.stringify([{ files: paths.map((path) => ({ path })) }]);

test("accepts packed files covered by the allowlist and required files", () => {
  expect(validatePackManifest(manifest(["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md", "src/index.mjs", "docs/README.md"]), ["src/", "docs/"])).toBeNull();
});

test("accepts npm's object-shaped manifest and rejects malformed file entries", () => {
  const paths = ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"];
  expect(validatePackManifest(JSON.stringify({ files: paths.map((path) => ({ path })) }), [])).toBeNull();
  expect(validatePackManifest(manifest(paths), null)).toBeNull();
  expect(validatePackManifest(JSON.stringify([{ files: [{ path: 7 }] }]), [])).toContain("files array");
  expect(validatePackManifest("null", [])).toContain("files array");
});

test("accepts npm 12 scoped object-shaped manifests", () => {
  const paths = ["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"];
  expect(validatePackManifest(JSON.stringify({ "@eliware/codescope": { files: paths.map((path) => ({ path })) } }), [])).toBeNull();
});

test("rejects invalid, incomplete, and over-broad pack manifests", () => {
  expect(validatePackManifest("not json", ["src/"])).toContain("invalid JSON");
  expect(validatePackManifest(manifest(["package.json"]), ["src/"])).toContain("omitted");
  expect(validatePackManifest(manifest(["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md", "secret.txt"]), ["src/"])).toContain("outside");
  expect(validatePackManifest(manifest(["package.json", "README.md", "LICENSE", "RELEASE_NOTES.md"]), ["src/"])).toContain("do not match");
});
