import { expect, test } from "@jest/globals";
import { validateAppliedProfiles } from "../../src/orchestrators/validate-applied-profiles.mjs";

const catalog = { profiles: { general: {}, application: {} } };

test("accepts known profiles independently without inferred inheritance", () => {
  expect(validateAppliedProfiles(["general", "application"], catalog)).toBeNull();
  expect(validateAppliedProfiles(["application"], catalog)).toBeNull();
});

test("rejects unknown profiles", () => {
  expect(validateAppliedProfiles(["general", "unknown"], catalog)).toBe(
    "Unknown convention group: unknown.",
  );
});

test("uses bundled catalog when no catalog is supplied", () => {
  expect(validateAppliedProfiles(["general"])).toBeNull();
});
