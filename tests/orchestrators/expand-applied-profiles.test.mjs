import { expect, test } from "@jest/globals";
import { expandAppliedProfiles } from "../../src/orchestrators/expand-applied-profiles.mjs";

const authority = { profiles: { general: {}, application: {}, cli: {} } };

test("keeps known profiles in order while removing duplicates and unknown names", () => {
  expect(expandAppliedProfiles(["general", "application", "general", "unknown"], authority))
    .toEqual(["general", "application"]);
});

test("uses bundled profile authority by default", () => {
  const profiles = expandAppliedProfiles(["general", "unknown"]);
  expect(profiles).toContain("general");
  expect(profiles).not.toContain("unknown");
});
