import { expect, test } from "@jest/globals";
import { requiresReleaseNotes } from "../../../../../src/checks/general/E-0.1/E-0.1.26/requires-release-notes.mjs";

test("requires release notes for release-bearing application and publication profiles", () => {
  for (const profile of ["application", "library", "npm-published", "ghcr-published"]) {
    expect(requiresReleaseNotes({ eliware: { apply: ["general", profile] } })).toBe(true);
  }
});

test("does not require release notes for other repository profiles", () => {
  for (const packageJson of [
    undefined,
    {},
    { eliware: { apply: ["general", "private"] } },
    { eliware: { apply: "application" } },
  ]) {
    expect(requiresReleaseNotes(packageJson)).toBe(false);
  }
});
