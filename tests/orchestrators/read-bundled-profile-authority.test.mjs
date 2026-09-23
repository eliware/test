import { expect, test } from "@jest/globals";
import {
  bundledConventionVersion,
  expandAppliedProfiles,
  readBundledProfileAuthority,
  validateAppliedProfiles,
} from "../../src/orchestrators/read-bundled-profile-authority.mjs";

function directories(...names) {
  return () => names.map((name) => ({ name, isDirectory: () => true }));
}

test("derives available profiles from bundled check directories", () => {
  const authority = readBundledProfileAuthority({
    root: "C:/fixture/checks",
    listDirectories: directories("cli", "general", "application"),
  });
  expect(authority.version).toBe(bundledConventionVersion);
  expect(Object.keys(authority.profiles)).toEqual(["application", "cli", "general"]);
  expect(authority.profiles.cli).toEqual({ profile: "cli" });
  expect(readBundledProfileAuthority().profiles).toEqual(expect.objectContaining({
    general: { profile: "general" },
  }));
});

test("validates explicit profile selections without inferred inheritance", () => {
  const authority = readBundledProfileAuthority({
    listDirectories: directories("application", "cli", "fork", "general"),
  });
  expect(validateAppliedProfiles(["general", "application", "cli"], authority)).toBeNull();
  expect(validateAppliedProfiles(["cli"], authority)).toBeNull();
  expect(expandAppliedProfiles(["cli"], authority)).toEqual(["cli"]);
  expect(expandAppliedProfiles(["general", "cli", "general"], authority)).toEqual(["general", "cli"]);
  expect(expandAppliedProfiles(["general", "not-a-profile"], authority)).toEqual(["general"]);
  expect(validateAppliedProfiles(["general", "unknown"], authority)).toContain("Unknown");
  expect(validateAppliedProfiles(["general", "fork"], authority)).toContain("excludes");
});

test("uses discovered authority by default when validating and expanding profiles", () => {
  const profiles = Object.keys(readBundledProfileAuthority().profiles);
  expect(validateAppliedProfiles(profiles.filter((profile) => profile !== "fork"))).toBeNull();
  expect(expandAppliedProfiles(profiles)).toEqual(profiles);
});

test("rejects empty, unreadable, and non-directory profile listings", () => {
  expect(() => readBundledProfileAuthority({ listDirectories: directories() })).toThrow("cannot be empty");
  expect(() => readBundledProfileAuthority({ listDirectories: () => { throw new Error("denied"); } }))
    .toThrow("could not be discovered");
  expect(() => readBundledProfileAuthority({
    listDirectories: () => [{ name: "not-a-profile", isDirectory: () => false }],
  })).toThrow("cannot be empty");
});
