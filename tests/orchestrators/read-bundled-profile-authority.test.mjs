import { expect, test } from "@jest/globals";
import {
  bundledConventionVersion,
  expandAppliedProfiles,
  readBundledProfileAuthority,
  validateAppliedProfiles,
} from "../../src/orchestrators/read-bundled-profile-authority.mjs";

test("derives profile and directive authority from the bundled v8 snapshot", () => {
  const authority = readBundledProfileAuthority({
    snapshot: {
      version: "8.0",
      checks: {
        "E-1": { source: "general.json", dos: ["General rule."] },
        "E-1.130": { source: "application.json", dos: ["Application rule."] },
      },
    },
  });
  expect(authority.version).toBe(bundledConventionVersion);
  expect(Object.keys(authority.profiles)).toEqual(["general", "application"]);
  expect(authority.directives).toEqual({ "E-1": "general", "E-1.130": "application" });
  expect(readBundledProfileAuthority().profiles.general).toEqual({ profile: "general" });
});

test("validates explicit profile selections without inferred inheritance", () => {
  const authority = readBundledProfileAuthority();
  expect(validateAppliedProfiles(["general", "application", "cli"], authority)).toBeNull();
  expect(validateAppliedProfiles(["cli"], authority)).toBeNull();
  expect(expandAppliedProfiles(["cli"], authority)).toEqual(["cli"]);
  expect(expandAppliedProfiles(["general", "cli", "general"], authority)).toEqual([
    "general",
    "cli",
  ]);
  expect(expandAppliedProfiles(["general", "not-a-profile"], authority)).toEqual(["general"]);
  expect(validateAppliedProfiles(["general", "unknown"], authority)).toContain("Unknown");
  expect(validateAppliedProfiles(["general", "fork"], authority)).toContain("excludes");
});

test("uses snapshot authority by default when validating and expanding profiles", () => {
  const profiles = Object.keys(readBundledProfileAuthority().profiles);
  expect(validateAppliedProfiles(profiles.filter((profile) => profile !== "fork"))).toBeNull();
  expect(expandAppliedProfiles(profiles)).toEqual(profiles);
});

test("rejects invalid or empty bundled authority snapshots", () => {
  expect(() => readBundledProfileAuthority({ snapshot: { version: "7.0", checks: {} } })).toThrow(
    "missing or invalid",
  );
  expect(() => readBundledProfileAuthority({ snapshot: { version: "8.0", checks: {} } })).toThrow(
    "cannot be empty",
  );
  expect(() =>
    readBundledProfileAuthority({
      snapshot: { version: "8.0", checks: { "E-1": { source: "general" } } },
    }),
  ).toThrow("no valid source profile");
  expect(() =>
    readBundledProfileAuthority({
      snapshot: { version: "8.0", checks: { "E-1": { source: "../general.json" } } },
    }),
  ).toThrow("invalid source profile");
});
