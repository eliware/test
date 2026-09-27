import { expect, test } from "@jest/globals";
import { validateAppliedProfiles } from "../../src/orchestrators/validate-applied-profiles.mjs";

const authority = { profiles: { general: {}, application: {}, fork: {} } };

test("accepts known profiles independently without inferred inheritance", () => {
  expect(validateAppliedProfiles(["general", "application"], authority)).toBeNull();
  expect(validateAppliedProfiles(["application"], authority)).toBeNull();
});

test("rejects unknown profiles and combining the exclusive fork profile", () => {
  expect(validateAppliedProfiles(["general", "unknown"], authority)).toBe("Unknown convention group: unknown.");
  expect(validateAppliedProfiles(["general", "fork"], authority)).toContain("excludes");
  expect(validateAppliedProfiles(["fork"], authority)).toBeNull();
});

test("uses bundled authority when no authority is supplied", () => {
  expect(validateAppliedProfiles(["general"])).toBeNull();
});
