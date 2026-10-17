import { expect, test } from "@jest/globals";
import { validatePackManifest } from "../../../../../../src/validation/stages/pack/validate/pack/manifest.mjs";

const packagePaths = [
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
const manifest = (paths) => JSON.stringify([{ files: paths.map((path) => ({ path })) }]);

test("accepts the array and object forms of the npm manifest", () => {
  expect(validatePackManifest(manifest(packagePaths), allowlist)).toBeNull();
  expect(
    validatePackManifest(
      JSON.stringify({ files: packagePaths.map((path) => ({ path })) }),
      allowlist,
    ),
  ).toBeNull();
  expect(
    validatePackManifest(
      JSON.stringify({ target: { name: "target", files: packagePaths.map((path) => ({ path })) } }),
      allowlist,
      "target",
    ),
  ).toBeNull();
});

test("reports invalid JSON and malformed manifest entries", () => {
  expect(validatePackManifest("not json", allowlist)).toContain("invalid JSON");
  expect(validatePackManifest("null", allowlist)).toContain("files array");
  expect(validatePackManifest(JSON.stringify([{ files: [{ path: 7 }] }]), allowlist)).toContain(
    "files array",
  );
});

test("returns content policy failures from the manifest coordinator", () => {
  expect(validatePackManifest(manifest(["package.json"]), allowlist)).toContain("omitted");
  expect(validatePackManifest(manifest(packagePaths), undefined)).toContain("must be an array");
});

test("checks public package entrypoints after validating the packed content", () => {
  expect(
    validatePackManifest(manifest(packagePaths), allowlist, undefined, {
      main: "./src/missing.mjs",
    }),
  ).toContain("public package entrypoints");
});
