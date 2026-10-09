import { expect, test } from "@jest/globals";
import { validateAppliedProfiles } from "../../../src/validation/planning/validate-applied-profiles.mjs";

const catalog = {
  profiles: {
    general: { requires: [], conflicts: [] },
    application: { requires: [], conflicts: [] },
    cli: { requires: ["application"], conflicts: [] },
    discord: { requires: ["application"], conflicts: [] },
    "mcp-server": { requires: ["application"], conflicts: [] },
    web: { requires: ["application"], conflicts: [] },
    documentation: { requires: ["private"], conflicts: [] },
    workspace: { requires: ["private"], conflicts: [] },
    infrastructure: { requires: ["private"], conflicts: [] },
    private: { requires: [], conflicts: ["npm-published"] },
    "npm-published": { requires: [], conflicts: ["private"] },
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

test("uses bundled catalog when no catalog is supplied", () => {
  expect(validateAppliedProfiles(["general"])).toBeNull();
});

test("rejects profile combinations declared as conflicts", () => {
  expect(validateAppliedProfiles(["general", "npm-published", "private"], catalog)).toBe(
    "Applied profiles conflict: npm-published and private.",
  );
});
