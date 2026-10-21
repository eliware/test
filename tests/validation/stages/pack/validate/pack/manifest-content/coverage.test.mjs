import { expect, test } from "@jest/globals";
import { validatePackManifestCoverage } from "../../../../../../../src/validation/stages/pack/validate/pack/manifest-content/coverage.mjs";

const required = [
  "package.json",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "RELEASE_NOTES.md",
  "src/index.mjs",
  "docs/README.md",
  "specs/directives.yaml",
];
const entries = required.map((path) => ({ path }));
test("accepts required package content", () => {
  expect(validatePackManifestCoverage(entries)).toBeNull();
});

test("reports missing required package content", () => {
  expect(validatePackManifestCoverage([{ path: "package.json" }])).toContain(
    "omitted required files",
  );
});

test("requires runtime, documentation, and specification trees", () => {
  expect(
    validatePackManifestCoverage(entries.filter(({ path }) => !path.startsWith("src/"))),
  ).toContain("runtime files");
  expect(
    validatePackManifestCoverage(entries.filter(({ path }) => !path.startsWith("docs/"))),
  ).toContain("documentation files");
  expect(
    validatePackManifestCoverage(entries.filter(({ path }) => !path.startsWith("specs/"))),
  ).toContain("specification files");
});
