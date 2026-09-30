import { expect, test } from "@jest/globals";
import { validateAppliedProfiles } from "../../src/orchestrators/validate-applied-profiles.mjs";

const catalog = {
  profiles: {
    general: {},
    application: {},
    cli: {},
    discord: {},
    "mcp-server": {},
    web: {},
    documentation: {},
    workspace: {},
    infrastructure: {},
    private: {},
  },
};

test("accepts explicitly applied profiles and requires general", () => {
  expect(validateAppliedProfiles(["general", "application"], catalog)).toBeNull();
  expect(validateAppliedProfiles(["application"], catalog)).toContain("explicitly apply general");
});

test("rejects unknown profiles", () => {
  expect(validateAppliedProfiles(["general", "unknown"], catalog)).toBe(
    "Unknown convention group: unknown.",
  );
});

test.each(["documentation", "workspace", "infrastructure"])(
  "%s requires the private profile",
  (profile) => {
    expect(validateAppliedProfiles(["general", profile], catalog)).toContain("private");
    expect(validateAppliedProfiles(["general", profile, "private"], catalog)).toBeNull();
  },
);

test.each(["cli", "discord", "mcp-server", "web"])(
  "%s requires an explicitly applied application profile",
  (profile) => {
    expect(validateAppliedProfiles(["general", profile], catalog)).toContain("application");
    expect(validateAppliedProfiles(["general", profile, "application"], catalog)).toBeNull();
  },
);

test("uses bundled catalog when no catalog is supplied", () => {
  expect(validateAppliedProfiles(["general"])).toBeNull();
});
