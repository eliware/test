import { expect, test } from "@jest/globals";
import { bundledConventionVersion } from "../../../../src/validation/check-discovery/read/bundled-profile-catalog.mjs";
import { readProfileCombinationPolicy } from "../../../../src/validation/planning/read/profile-combination-policy.mjs";

test("loads one validated policy for every bundled profile", () => {
  const policy = readProfileCombinationPolicy();
  expect(Object.keys(policy.profiles)).toEqual(
    expect.arrayContaining([
      "general",
      "library",
      "application",
      "cli",
      "web",
      "discord",
      "mcp-server",
      "database",
      "workspace",
      "documentation",
      "infrastructure",
      "npm-published",
      "ghcr-published",
      "private",
    ]),
  );
});

test("rejects an invalid policy before planning continues", () => {
  expect(() =>
    readProfileCombinationPolicy({
      read: () => `version: '${bundledConventionVersion}'\nprofiles: {}\n`,
    }),
  ).toThrow("Profile policy omits profiles");
});

test("keeps canonical order out of the combination policy", () => {
  const policy = readProfileCombinationPolicy();
  expect(policy.profiles.general).toEqual({ requires: [], requiresAny: [], prohibits: [] });
  expect(policy.profiles["ghcr-published"]).toEqual({
    requires: ["general"],
    requiresAny: [],
    prohibits: ["library", "workspace", "documentation", "infrastructure", "npm-published"],
  });
  expect(policy.profiles.private.prohibits).toEqual(["library", "npm-published"]);
  expect(policy.profiles.library.prohibits).toContain("private");
  expect(policy.profiles["ghcr-published"].prohibits).not.toContain("private");
  expect(policy.profiles["ghcr-published"].requires).not.toContain("application");
});
