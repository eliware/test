import { expect, test } from "@jest/globals";
import { expandAppliedProfiles, readBundledProfileAuthority, validateAppliedProfiles } from "../../src/orchestrators/read-bundled-profile-authority.mjs";

test("loads the complete bundled v8 profile authority", () => {
  const authority = readBundledProfileAuthority();
  expect(authority.version).toBe("8.0");
  expect(Object.keys(authority.profiles)).toEqual(expect.arrayContaining(["general", "application", "cli", "npm-published", "fork"]));
  expect(authority.profiles.cli.extends).toEqual(["application"]);
});

test("validates selected profiles against bundled inheritance", () => {
  const authority = readBundledProfileAuthority();
  expect(validateAppliedProfiles(["general", "application", "cli"], authority)).toBeNull();
  expect(validateAppliedProfiles(["cli"], authority)).toBeNull();
  expect(validateAppliedProfiles(["general", "unknown"], authority)).toContain("Unknown");
  expect(validateAppliedProfiles(["general", "fork"], authority)).toContain("excludes");
  expect(validateAppliedProfiles(["general"])).toBeNull();
});

test("rejects a selected profile whose inherited authority is absent", () => {
  const authority = { version: "8.0", profiles: { cli: { profile: "cli", document: "cli.json", version: "8.0", extends: ["application"] } } };
  expect(() => readBundledProfileAuthority({ manifest: authority, root: "C:/does-not-exist" })).toThrow();
});

test("expands profiles with and without inherited metadata", () => {
  expect(expandAppliedProfiles(["child"], {
    profiles: { child: { extends: ["base"] }, base: { extends: [] } },
  })).toEqual(["base", "child"]);
  expect(expandAppliedProfiles(["standalone"], { profiles: { standalone: {} } })).toEqual(["standalone"]);
  expect(expandAppliedProfiles(["general"])).toContain("general");
});

test.each([
  { version: "7.0", profiles: {} },
  { version: "8.0", profiles: [] },
  { version: "8.0", profiles: { general: null } },
  { version: "8.0", profiles: { general: { profile: "wrong", document: "general.json", version: "8.0", extends: [] } } },
  { version: "8.0", profiles: { general: { profile: "general", document: "other.json", version: "8.0", extends: [] } } },
  { version: "8.0", profiles: { general: { profile: "general", document: "general.json", version: "7.0", extends: [] } } },
  { version: "8.0", profiles: { general: { profile: "general", document: "general.json", version: "8.0", extends: ["general"] } } },
  { version: "8.0", profiles: { general: { profile: "general", document: "general.json", version: "8.0", extends: ["missing"] } } },
])("rejects malformed bundled authority %#", (manifest) => {
  expect(() => readBundledProfileAuthority({ manifest })).toThrow();
});

test("rejects an empty profile registry and non-directory profile", () => {
  expect(() => readBundledProfileAuthority({ manifest: { version: "8.0", profiles: {} } })).toThrow("cannot be empty");
  const manifest = { version: "8.0", profiles: { general: { profile: "general", document: "general.json", version: "8.0", extends: [] } } };
  expect(() => readBundledProfileAuthority({ manifest, statDirectory: () => ({ isDirectory: () => false }) })).toThrow("not a directory");
});

test("rejects a missing bundled profile directory and a stale directory list", () => {
  const manifest = { version: "8.0", profiles: { absent: { profile: "absent", document: "absent.json", version: "8.0", extends: [] } } };
  expect(() => readBundledProfileAuthority({ manifest, root: "C:/does-not-exist" })).toThrow("missing or invalid");
  expect(() => readBundledProfileAuthority({ manifest: { version: "8.0", profiles: { general: { profile: "general", document: "general.json", version: "8.0", extends: [] } } }, listDirectories: () => [] })).toThrow("do not match");
});
