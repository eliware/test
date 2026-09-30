import { expect, test } from "@jest/globals";
import { validateAppliedProfiles } from "../../src/orchestrators/validate-applied-profiles.mjs";

const catalog = {
  profiles: {
    general: {},
    application: {},
    documentation: {},
    workspace: {},
    infrastructure: {},
    private: {},
  },
};

test("accepts known profiles independently without inferred inheritance", () => {
  expect(validateAppliedProfiles(["general", "application"], catalog)).toBeNull();
  expect(validateAppliedProfiles(["application"], catalog)).toBeNull();
});

test("rejects unknown profiles", () => {
  expect(validateAppliedProfiles(["general", "unknown"], catalog)).toBe(
    "Unknown convention group: unknown.",
  );
});

test.each(["documentation", "workspace", "infrastructure"])(
  "%s requires the private profile",
  (profile) => {
    expect(validateAppliedProfiles([profile], catalog)).toContain("require private");
    expect(validateAppliedProfiles([profile, "private"], catalog)).toBeNull();
  },
);

test("uses bundled catalog when no catalog is supplied", () => {
  expect(validateAppliedProfiles(["general"])).toBeNull();
});
