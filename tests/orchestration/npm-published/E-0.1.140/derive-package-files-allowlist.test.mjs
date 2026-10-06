import { expect, test } from "@jest/globals";
import { derivePackageFilesAllowlist } from "../../../../src/orchestration/npm-published/E-0.1.140/derive-package-files-allowlist.mjs";

const base = ["src/", "docs/", "README.md", "AGENTS.md", "LICENSE", "RELEASE_NOTES.md"];

test("derives common package contents and profile additions", () => {
  expect(derivePackageFilesAllowlist()).toEqual(base);
  expect(derivePackageFilesAllowlist({ eliware: { apply: ["application"] } })).toEqual([
    ...base,
    "bin/",
  ]);
  expect(derivePackageFilesAllowlist({ eliware: { apply: ["cli"] } })).toEqual(base);
  expect(derivePackageFilesAllowlist({ eliware: { apply: ["library"] } })).toEqual([
    ...base,
    "examples/",
  ]);
  expect(
    derivePackageFilesAllowlist({
      name: "@eliware/test",
      eliware: { apply: ["application", "cli"] },
    }),
  ).toEqual([...base, "bin/", "specs/"]);
});

test("retains the explicitly selected environment example as an optional entry", () => {
  expect(
    derivePackageFilesAllowlist({
      eliware: { apply: ["application"] },
      files: [...base, "bin/", ".env.example"],
    }),
  ).toEqual([...base, "bin/", ".env.example"]);
});
