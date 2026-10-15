import { expect, test } from "@jest/globals";
import { validateAppliedProfiles } from "../../../../src/validation/planning/validate/applied-profiles.mjs";

const catalog = {
  profiles: {
    general: { requires: [], conflicts: [] },
    application: {
      requires: [],
      conflicts: ["documentation", "workspace", "infrastructure", "library"],
    },
    database: {
      requires: ["application"],
      conflicts: ["library", "documentation", "workspace", "infrastructure"],
    },
    cli: { requires: ["application"], conflicts: [] },
    discord: { requires: ["application"], conflicts: [] },
    "mcp-server": { requires: ["application"], conflicts: [] },
    web: { requires: ["application"], conflicts: [] },
    documentation: { requires: ["private"], conflicts: ["application", "database"] },
    workspace: { requires: ["private"], conflicts: ["application", "database"] },
    infrastructure: { requires: ["private"], conflicts: ["application", "database"] },
    library: { requires: ["general"], conflicts: ["application", "database"] },
    private: { requires: [], conflicts: ["npm-published"] },
    "npm-published": { requires: [], conflicts: ["private"] },
    "ghcr-published": { requires: [], conflicts: ["documentation", "workspace", "infrastructure"] },
  },
};

test("accepts explicitly applied profiles and requires general", () => {
  expect(validateAppliedProfiles(["general", "application"], catalog)).toBeNull();
  expect(validateAppliedProfiles(["application"], catalog)).toContain("explicitly apply general");
});

test("requires the canonical profile order", () => {
  expect(validateAppliedProfiles(["general", "application", "cli"], catalog)).toBeNull();
  expect(validateAppliedProfiles(["general", "cli", "application"], catalog)).toContain(
    "canonical order",
  );
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
    expect(validateAppliedProfiles(["general", "application", profile], catalog)).toBeNull();
  },
);

test.each(
  [
    ["general", "application", "database"],
    ["general", "application", "database", "web", "ghcr-published"],
    ["general", "application", "database", "private"],
  ].map((profiles) => ({ profiles })),
)("accepts database profile composition %j", ({ profiles }) => {
  expect(validateAppliedProfiles(profiles, catalog)).toBeNull();
});

test.each([
  { profile: "library", profiles: ["general", "library", "application", "database"] },
  {
    profile: "documentation",
    profiles: ["general", "documentation", "application", "database", "private"],
  },
  {
    profile: "workspace",
    profiles: ["general", "workspace", "application", "database", "private"],
  },
  {
    profile: "infrastructure",
    profiles: ["general", "application", "database", "infrastructure", "private"],
  },
])("rejects database with $profile", ({ profiles }) => {
  expect(validateAppliedProfiles(profiles, catalog)).toContain("conflict");
});

test("requires application when database applies", () => {
  expect(validateAppliedProfiles(["general", "database"], catalog)).toContain("application");
});

test("uses bundled catalog when no catalog is supplied", () => {
  expect(validateAppliedProfiles(["general"])).toBeNull();
});

test("rejects profile combinations declared as conflicts", () => {
  expect(validateAppliedProfiles(["general", "npm-published", "private"], catalog)).toBe(
    "Applied profiles conflict: npm-published and private.",
  );
});
