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
const allowlist = [
  "src/",
  "docs/",
  "specs/",
  "README.md",
  "AGENTS.md",
  "LICENSE",
  "RELEASE_NOTES.md",
];

test("accepts required content covered by the allowlist", () => {
  expect(validatePackManifestCoverage(entries, allowlist)).toBeNull();
});

test("reports unexpected and missing package content", () => {
  expect(validatePackManifestCoverage([...entries, { path: "extra.txt" }], allowlist)).toContain(
    "outside package.json.files",
  );
  expect(validatePackManifestCoverage([{ path: "package.json" }], allowlist)).toContain(
    "omitted required files",
  );
});

test("requires runtime, documentation, specification trees, and matched allowlist entries", () => {
  expect(
    validatePackManifestCoverage(
      entries.filter(({ path }) => !path.startsWith("src/")),
      allowlist,
    ),
  ).toContain("runtime files");
  expect(
    validatePackManifestCoverage(
      entries.filter(({ path }) => !path.startsWith("docs/")),
      allowlist,
    ),
  ).toContain("documentation files");
  expect(
    validatePackManifestCoverage(
      entries.filter(({ path }) => !path.startsWith("specs/")),
      allowlist,
    ),
  ).toContain("specification files");
  expect(validatePackManifestCoverage(entries, [...allowlist, "examples/"])).toContain(
    "do not match",
  );
});
