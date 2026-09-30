import { expect, test } from "@jest/globals";
import { requiresReleaseNotes } from "../../../../../src/checks/general/E-0.1/E-0.1.26/requires-release-notes.mjs";

test("requires release notes only for application and library profiles", () => {
  for (const profile of ["application", "library"]) {
    expect(requiresReleaseNotes({ eliware: { apply: ["general", profile] } })).toBe(true);
  }
  for (const profile of ["npm-published", "ghcr-published"]) {
    expect(requiresReleaseNotes({ eliware: { apply: ["general", profile] } })).toBe(false);
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
