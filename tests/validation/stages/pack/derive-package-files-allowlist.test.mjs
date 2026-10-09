import { expect, test } from "@jest/globals";
import { derivePackageFilesAllowlist } from "../../../../src/validation/stages/pack/derive-package-files-allowlist.mjs";

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
  expect(derivePackageFilesAllowlist({ eliware: { apply: ["general", "npm-published"] } })).toEqual(
    [...base, "specs/"],
  );
  expect(
    derivePackageFilesAllowlist({ eliware: { apply: ["application", "npm-published"] } }),
  ).toEqual([...base, "bin/", "specs/"]);
  expect(derivePackageFilesAllowlist({ eliware: { apply: ["library", "npm-published"] } })).toEqual(
    [...base, "examples/", "specs/"],
  );
  expect(
    derivePackageFilesAllowlist({
      name: "@eliware/test",
      eliware: { apply: ["application", "cli", "npm-published"] },
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
