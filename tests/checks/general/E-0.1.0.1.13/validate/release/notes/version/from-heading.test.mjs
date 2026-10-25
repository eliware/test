import { expect, test } from "@jest/globals";
import {
  parseReleaseVersionHeading,
  releaseVersionFromHeading,
} from "../../../../../../../../src/checks/general/E-0.1.0.1.13/validate/release/notes/version/from-heading.mjs";
import { packageVersion } from "../../../../../../../../test-fixtures/helpers/project-version.mjs";

test("parses a version and date from a release heading", () => {
  expect(parseReleaseVersionHeading(`## ${packageVersion} — 2026-10-25`)?.slice(0, 3)).toEqual([
    `## ${packageVersion} — 2026-10-25`,
    packageVersion,
    "2026-10-25",
  ]);
  expect(releaseVersionFromHeading(`## ${packageVersion} — 2026-10-25`)).toBe(packageVersion);
});

test("returns no version for malformed release headings", () => {
  expect(parseReleaseVersionHeading("## 01.0.0 — 2026-10-25")).toBeNull();
  expect(releaseVersionFromHeading("Unreleased")).toBeNull();
});
